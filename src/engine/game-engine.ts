import type { Game, Story, Player, RoundHistory } from '@/types/game'
import { AUCTION_STARTING_CHIPS } from '@/types/game'
import { GameStore } from './game-store'
import { createStateMachine } from './state-machine'
import { calculateRiver } from './river'

export class GameEngine {
  private store = new GameStore()
  private machines = new Map<string, ReturnType<typeof createStateMachine>>()

  createGame(dealerId: string, dealerSocketId: string, sprintCapacity: number, stories: Story[]): Game {
    const game = this.store.createGame(
      { id: dealerId, socketId: dealerSocketId },
      sprintCapacity
    )
    game.deck = stories
    this.machines.set(game.id, createStateMachine('LOBBY'))
    return game
  }

  getGame(id: string): Game | undefined {
    return this.store.getGame(id)
  }

  addPlayer(gameId: string, playerId: string, socketId: string, name: string): Game {
    const game = this.requireGame(gameId)
    if (game.players.some((p) => p.name === name)) {
      throw new Error(`Player name "${name}" is already taken`)
    }
    const player: Player = {
      id: playerId,
      socketId,
      name,
      score: 0,
      currentBet: null,
      auctionChips: 0,
      connected: true,
    }
    game.players.push(player)
    return game
  }

  reconnectPlayer(gameId: string, playerId: string, newSocketId: string): Game {
    const game = this.requireGame(gameId)
    const player = game.players.find((p) => p.id === playerId)
    if (!player) throw new Error('Player not found')
    player.socketId = newSocketId
    player.connected = true
    return game
  }

  disconnectPlayer(gameId: string, socketId: string): Game {
    const game = this.requireGame(gameId)
    const player = game.players.find((p) => p.socketId === socketId)
    if (player) player.connected = false
    return game
  }

  selectStory(gameId: string, storyId: string): Game {
    const game = this.requireGame(gameId)
    const sm = this.requireMachine(gameId)

    const storyIndex = game.deck.findIndex((s) => s.id === storyId)
    if (storyIndex === -1) throw new Error('Story not found in deck')

    sm.transition('dealer:select-story')
    game.currentStory = game.deck[storyIndex]
    game.phase = sm.currentState

    // Compute river from all stories that have storyPoints
    const allStories = [...game.deck, ...game.estimated]
    game.river = calculateRiver(game.currentStory, allStories)

    // Clear player bets
    game.players.forEach((p) => { p.currentBet = null })

    // Auto-transition to BETTING
    sm.transition('story-displayed')
    game.phase = sm.currentState

    return game
  }

  setRiver(gameId: string, values: number[]): Game {
    const game = this.requireGame(gameId)
    game.river = values
    return game
  }

  submitBet(gameId: string, playerId: string, value: number | 'all_in'): Game {
    const game = this.requireGame(gameId)
    const sm = this.requireMachine(gameId)

    if (game.phase !== 'BETTING') throw new Error('Not in BETTING phase')

    const player = game.players.find((p) => p.id === playerId)
    if (!player) throw new Error('Player not found')
    player.currentBet = value

    // Check if all connected players have submitted
    const connectedPlayers = game.players.filter((p) => p.connected)
    const allSubmitted = connectedPlayers.every((p) => p.currentBet !== null)

    if (allSubmitted) {
      const hasAllIn = connectedPlayers.some((p) => p.currentBet === 'all_in')
      if (hasAllIn) {
        sm.transition('all-in-detected')
      } else {
        sm.transition('all-players-submitted')
        // Auto-transition REVEAL → ACCEPT
        sm.transition('cards-shown')
      }
      game.phase = sm.currentState
    }

    return game
  }

  acceptValue(gameId: string, value: number): Game {
    const game = this.requireGame(gameId)
    const sm = this.requireMachine(gameId)

    if (game.phase !== 'ACCEPT') throw new Error('Not in ACCEPT phase')
    if (!game.currentStory) throw new Error('No current story')

    // Score players
    game.players.forEach((p) => {
      if (p.currentBet === value) p.score += 1
    })

    // Record round history
    const round: RoundHistory = {
      storyId: game.currentStory.id,
      storyTitle: game.currentStory.title,
      storyDescription: game.currentStory.description,
      phase: 'estimation',
      bets: game.players.map((p) => ({
        playerId: p.id,
        playerName: p.name,
        value: p.currentBet!,
      })),
      acceptedValue: value,
      river: [...game.river],
      wasAllIn: false,
      wasReopened: false,
      shelved: false,
      auctionWinner: null,
      tied: false,
      tiedPlayers: [],
    }
    game.rounds.push(round)

    // Move story from deck to estimated
    game.currentStory.acceptedValue = value
    game.estimated.push(game.currentStory)
    game.deck = game.deck.filter((s) => s.id !== game.currentStory!.id)

    // Decrease capacity
    game.remainingCapacity -= value

    // Clean up
    game.currentStory = null
    game.river = []
    game.players.forEach((p) => { p.currentBet = null })

    // Phase stays at ACCEPT — dealer decides next action via selectStory, startAuction, or endGame
    // The state machine transition happens when the dealer takes their next action

    return game
  }

  reopenHand(gameId: string): Game {
    const game = this.requireGame(gameId)
    const sm = this.requireMachine(gameId)

    sm.transition('dealer:reopen')
    game.phase = sm.currentState
    game.players.forEach((p) => { p.currentBet = null })

    return game
  }

  shelveStory(gameId: string): Game {
    const game = this.requireGame(gameId)
    const sm = this.requireMachine(gameId)

    sm.transition('dealer:shelve')
    game.phase = sm.currentState

    // Story stays in deck (it was never removed)
    game.currentStory = null
    game.river = []
    game.players.forEach((p) => { p.currentBet = null })

    return game
  }

  initAuction(gameId: string): Game {
    const game = this.requireGame(gameId)
    game.players.forEach((p) => {
      game.auctionChips.set(p.id, AUCTION_STARTING_CHIPS)
      p.auctionChips = AUCTION_STARTING_CHIPS
    })
    return game
  }

  presentAuctionItem(gameId: string, storyId: string): Game {
    const game = this.requireGame(gameId)
    const sm = this.requireMachine(gameId)

    // Transition from ACCEPT or AUCTION_WON → AUCTION_PRESENT
    if (game.phase === 'ACCEPT') {
      sm.transition('dealer:start-auction')
    } else if (game.phase === 'AUCTION_WON') {
      sm.transition('dealer:start-auction')
    }
    game.phase = sm.currentState

    const storyIndex = game.deck.findIndex((s) => s.id === storyId)
    if (storyIndex === -1) throw new Error('Story not found in deck')
    game.currentStory = game.deck[storyIndex]

    // Auto-transition to AUCTION_BID
    sm.transition('story-displayed')
    game.phase = sm.currentState

    return game
  }

  resolveAuction(gameId: string, winnerPlayerId: string | null, finalBid: number, tied: boolean, tiedPlayerIds: string[]): Game {
    const game = this.requireGame(gameId)
    const sm = this.requireMachine(gameId)

    if (!game.currentStory) throw new Error('No current auction story')

    sm.transition('auction-resolved')
    game.phase = sm.currentState

    const round: RoundHistory = {
      storyId: game.currentStory.id,
      storyTitle: game.currentStory.title,
      storyDescription: game.currentStory.description,
      phase: 'auction',
      river: [],
      bets: [],
      acceptedValue: finalBid,
      wasAllIn: false,
      wasReopened: false,
      shelved: false,
      auctionWinner: winnerPlayerId ? game.players.find((p) => p.id === winnerPlayerId)?.name ?? null : null,
      tied,
      tiedPlayers: tiedPlayerIds.map((id) => game.players.find((p) => p.id === id)?.name ?? ''),
    }
    game.rounds.push(round)

    if (winnerPlayerId) {
      game.currentStory.assignee = game.players.find((p) => p.id === winnerPlayerId)?.name ?? null
      game.currentStory.acceptedValue = finalBid
      const winner = game.players.find((p) => p.id === winnerPlayerId)
      if (winner) winner.score += 1

      // Deduct chips from winner
      const currentChips = game.auctionChips.get(winnerPlayerId) ?? 0
      game.auctionChips.set(winnerPlayerId, currentChips - finalBid)
      if (winner) winner.auctionChips = currentChips - finalBid
    }

    // Move story from deck to estimated
    game.estimated.push(game.currentStory)
    game.deck = game.deck.filter((s) => s.id !== game.currentStory!.id)
    game.remainingCapacity -= finalBid

    game.currentStory = null

    return game
  }

  endGame(gameId: string): Game {
    const game = this.requireGame(gameId)
    const sm = this.requireMachine(gameId)

    sm.transition('dealer:end-game')
    game.phase = sm.currentState

    return game
  }

  private requireGame(gameId: string): Game {
    const game = this.store.getGame(gameId)
    if (!game) throw new Error(`Game ${gameId} not found`)
    return game
  }

  private requireMachine(gameId: string) {
    const sm = this.machines.get(gameId)
    if (!sm) throw new Error(`State machine for game ${gameId} not found`)
    return sm
  }
}
