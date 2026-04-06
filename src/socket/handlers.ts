import type { Server, Socket } from 'socket.io'
import type { GameEngine } from '@/engine/game-engine'
import type { ClientEvents, ServerEvents, GameStatePayload, PlayerStatus } from '@/types/events'
import type { Game } from '@/types/game'
import { parseStoriesCSV } from '@/engine/csv-parser'

type TypedSocket = Socket<ClientEvents, ServerEvents>
type TypedServer = Server<ClientEvents, ServerEvents>

export function buildStatePayload(game: Game, forPlayerId?: string): GameStatePayload {
  const player = forPlayerId ? game.players.find((p) => p.id === forPlayerId) : null

  return {
    gameId: game.id,
    phase: game.phase,
    sprintCapacity: game.sprintCapacity,
    remainingCapacity: game.remainingCapacity,
    deckCount: game.deck.length,
    estimatedCount: game.estimated.length,
    currentStory: game.currentStory
      ? { title: game.currentStory.title, description: game.currentStory.description }
      : null,
    currentStoryFull: null, // only for dealer
    river: game.river,
    players: game.players.map((p): PlayerStatus => ({
      id: p.id,
      name: p.name,
      hasVoted: p.currentBet !== null,
      connected: p.connected,
      score: p.score,
    })),
    myPlayerId: player?.id ?? null,
    myBet: player?.currentBet ?? null,
    auctionChips: player?.auctionChips ?? null,
    scores: game.players.map((p) => ({ id: p.id, name: p.name, score: p.score })),
  }
}

export function buildDealerStatePayload(game: Game): GameStatePayload {
  const payload = buildStatePayload(game)
  payload.currentStoryFull = game.currentStory
  payload.dealerDeck = game.deck
  payload.dealerEstimated = game.estimated.map((s) => ({
    title: s.title,
    acceptedValue: s.acceptedValue!,
  }))
  return payload
}

export function broadcastPlayerStatus(io: TypedServer, game: Game): void {
  const statuses: PlayerStatus[] = game.players.map((p) => ({
    id: p.id,
    name: p.name,
    hasVoted: p.currentBet !== null,
    connected: p.connected,
    score: p.score,
  }))
  io.to(game.id).emit('game:player-status', { players: statuses })
}

export function registerHandlers(io: TypedServer, socket: TypedSocket, engine: GameEngine) {
  // Track which game/player this socket belongs to
  let currentGameId: string | null = null
  let currentPlayerId: string | null = null
  let isDealer = false

  const handlers: Record<string, (...args: any[]) => void> = {
    'dealer:create-game': async (data: { sprintCapacity: number; csvText?: string; stories?: any[] }) => {
      try {
        // Parse CSV server-side (csv-parse is a Node.js module)
        let stories = data.stories ?? []
        if (data.csvText) {
          console.log(`[dealer:create-game] Parsing CSV (${data.csvText.length} chars)...`)
          stories = await parseStoriesCSV(data.csvText)
          console.log(`[dealer:create-game] Parsed ${stories.length} stories`)
        }
        const game = engine.createGame(socket.id, socket.id, data.sprintCapacity, stories)
        console.log(`[dealer:create-game] Game ${game.id} created with ${game.deck.length} stories in deck`)
        currentGameId = game.id
        isDealer = true
        socket.join(game.id)
        socket.emit('game:state', buildDealerStatePayload(game))
      } catch (err: any) {
        console.error(`[dealer:create-game] Error:`, err.message)
        socket.emit('game:error', { message: err.message })
      }
    },

    'dealer:rejoin': (data: { gameId: string }) => {
      try {
        const game = engine.getGame(data.gameId)
        if (!game) throw new Error(`Game ${data.gameId} not found`)
        currentGameId = data.gameId
        isDealer = true
        socket.join(data.gameId)
        socket.emit('game:state', buildDealerStatePayload(game))
      } catch (err: any) {
        socket.emit('game:error', { message: err.message })
      }
    },

    'player:join': (data: { name: string; gameId: string }) => {
      try {
        const playerId = socket.id
        const game = engine.addPlayer(data.gameId, playerId, socket.id, data.name)
        currentGameId = data.gameId
        currentPlayerId = playerId
        socket.join(data.gameId)
        socket.emit('game:state', buildStatePayload(game, playerId))
        broadcastPlayerStatus(io, game)
      } catch (err: any) {
        socket.emit('game:error', { message: err.message })
      }
    },

    'dealer:select-story': (data: { storyId: string }) => {
      try {
        if (!currentGameId) throw new Error('No active game')
        const game = engine.selectStory(currentGameId, data.storyId)
        io.to(currentGameId).emit('game:phase', {
          phase: game.phase,
          story: isDealer ? game.currentStory! : undefined,
          river: game.river,
        })
        // Send minimal story to players, full to dealer
        io.to(currentGameId).emit('game:state', buildStatePayload(game))
        // Override for dealer with full info
        socket.emit('game:state', buildDealerStatePayload(game))
      } catch (err: any) {
        socket.emit('game:error', { message: err.message })
      }
    },

    'dealer:set-river': (data: { values: number[] }) => {
      try {
        if (!currentGameId) throw new Error('No active game')
        const game = engine.setRiver(currentGameId, data.values)
        io.to(currentGameId).emit('game:state', buildStatePayload(game))
        socket.emit('game:state', buildDealerStatePayload(game))
      } catch (err: any) {
        socket.emit('game:error', { message: err.message })
      }
    },

    'player:bet': (data: { value: number | 'all_in' }) => {
      try {
        if (!currentGameId || !currentPlayerId) throw new Error('No active game')
        const game = engine.submitBet(currentGameId, currentPlayerId, data.value)
        broadcastPlayerStatus(io, game)

        if (game.phase === 'REVEAL' || game.phase === 'ACCEPT') {
          const bets = game.players.map((p) => ({
            playerId: p.id,
            playerName: p.name,
            value: p.currentBet!,
          }))
          io.to(currentGameId).emit('round:reveal', { bets })
          io.to(currentGameId).emit('game:phase', { phase: game.phase })
        } else if (game.phase === 'ALL_IN_PAUSE') {
          io.to(currentGameId).emit('game:phase', { phase: 'ALL_IN_PAUSE' })
        }
      } catch (err: any) {
        socket.emit('game:error', { message: err.message })
      }
    },

    'dealer:accept': (data: { value: number }) => {
      try {
        if (!currentGameId) throw new Error('No active game')
        const acceptedValue = data.value
        // Capture each player's bet BEFORE acceptValue clears them
        const gameBeforeAccept = engine.getGame(currentGameId)!
        const playerBetsBeforeAccept = new Map<string, number | 'all_in' | null>(
          gameBeforeAccept.players.map((p) => [p.id, p.currentBet])
        )
        const game = engine.acceptValue(currentGameId, data.value)
        io.to(currentGameId).emit('game:scores', {
          players: game.players.map((p) => ({ id: p.id, name: p.name, score: p.score })),
        })
        // Send each player their own result with their bet preserved
        for (const player of game.players) {
          const playerSocket = io.sockets.sockets.get(player.socketId)
          if (playerSocket) {
            const myBetBeforeAccept = playerBetsBeforeAccept.get(player.id)
            const matched = typeof myBetBeforeAccept === 'number' && myBetBeforeAccept === acceptedValue
            playerSocket.emit('game:state', {
              ...buildStatePayload(game, player.id),
              lastAcceptedValue: acceptedValue,
              lastRoundMatched: matched,
              lastRoundMyBet: myBetBeforeAccept ?? null,
            })
          }
        }
        socket.emit('game:state', { ...buildDealerStatePayload(game), lastAcceptedValue: acceptedValue })

        // Auto-advance after 3 seconds: select next story, start auction, or end game
        const gameIdSnapshot = currentGameId
        setTimeout(() => {
          try {
            const currentGame = engine.getGame(gameIdSnapshot)
            if (!currentGame || currentGame.phase !== 'ACCEPT') return

            if (currentGame.remainingCapacity <= 0) {
              // Capacity exhausted — auto end game
              const finalGame = engine.endGame(gameIdSnapshot)
              const sortedPlayers = [...finalGame.players].sort((a, b) => b.score - a.score)
              io.to(gameIdSnapshot).emit('game:over', {
                players: sortedPlayers.map((p) => ({ name: p.name, finalScore: p.score })),
                winner: sortedPlayers[0]?.name ?? 'N/A',
              })
            } else if (currentGame.deck.length > 0) {
              // More stories and capacity — auto-deal next story
              const nextStory = currentGame.deck[0]
              const nextGame = engine.selectStory(gameIdSnapshot, nextStory.id)
              io.to(gameIdSnapshot).emit('game:phase', {
                phase: nextGame.phase,
                river: nextGame.river,
              })
              io.to(gameIdSnapshot).emit('game:state', buildStatePayload(nextGame))
              socket.emit('game:state', buildDealerStatePayload(nextGame))
            }
            // If deck is empty but capacity remains, stay in ACCEPT — dealer starts auction manually
          } catch {
            // Game may have ended or been cleaned up
          }
        }, 3000)
      } catch (err: any) {
        socket.emit('game:error', { message: err.message })
      }
    },

    'dealer:reopen': () => {
      try {
        if (!currentGameId) throw new Error('No active game')
        const game = engine.reopenHand(currentGameId)
        io.to(currentGameId).emit('game:phase', { phase: game.phase })
        broadcastPlayerStatus(io, game)
      } catch (err: any) {
        socket.emit('game:error', { message: err.message })
      }
    },

    'dealer:shelve': () => {
      try {
        if (!currentGameId) throw new Error('No active game')
        const game = engine.shelveStory(currentGameId)
        io.to(currentGameId).emit('game:state', buildStatePayload(game))
        socket.emit('game:state', buildDealerStatePayload(game))
      } catch (err: any) {
        socket.emit('game:error', { message: err.message })
      }
    },

    'dealer:start-auction': () => {
      try {
        if (!currentGameId) throw new Error('No active game')
        engine.initAuction(currentGameId)
        const game = engine.getGame(currentGameId)!
        io.to(currentGameId).emit('game:state', buildStatePayload(game))
        socket.emit('game:state', buildDealerStatePayload(game))
      } catch (err: any) {
        socket.emit('game:error', { message: err.message })
      }
    },

    'dealer:present-auction-item': (data: { storyId: string }) => {
      try {
        if (!currentGameId) throw new Error('No active game')
        const game = engine.presentAuctionItem(currentGameId, data.storyId)
        io.to(currentGameId).emit('game:state', buildStatePayload(game))
        socket.emit('game:state', buildDealerStatePayload(game))
      } catch (err: any) {
        socket.emit('game:error', { message: err.message })
      }
    },

    'player:auction-bid': (data: { amount: number } | { fold: true }) => {
      try {
        if (!currentGameId || !currentPlayerId) throw new Error('No active game')
        const game = engine.getGame(currentGameId)
        if (!game) throw new Error('Game not found')

        if ('fold' in data) {
          // Mark player as folded in auction state
          // Check if only one player remains — if so, resolve auction
          const activePlayers = game.players.filter((p) => p.connected)
          // Auction resolution logic: track folds in game engine, resolve when one remains or all fold
          // For now, broadcast updated auction state
          io.to(currentGameId).emit('game:state', buildStatePayload(game))
        } else {
          // Player raises — update current bid
          // Deduct chips, advance turn to next player
          io.to(currentGameId).emit('auction:bid', {
            storyTitle: game.currentStory?.title ?? '',
            currentBid: data.amount,
            currentBidder: game.players.find((p) => p.id === currentPlayerId)?.name ?? null,
            activePlayers: game.players.map((p) => ({
              id: p.id,
              name: p.name,
              chips: game.auctionChips.get(p.id) ?? 0,
              folded: false,
            })),
            whoseTurn: '', // next player in join order
          })
        }
      } catch (err: any) {
        socket.emit('game:error', { message: err.message })
      }
    },

    'dealer:end-game': () => {
      try {
        if (!currentGameId) throw new Error('No active game')
        const game = engine.endGame(currentGameId)
        const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score)
        io.to(currentGameId).emit('game:over', {
          players: sortedPlayers.map((p) => ({ name: p.name, finalScore: p.score })),
          winner: sortedPlayers[0]?.name ?? 'N/A',
        })
      } catch (err: any) {
        socket.emit('game:error', { message: err.message })
      }
    },
  }

  // Register all handlers on the socket
  for (const [event, handler] of Object.entries(handlers)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(socket as any).on(event, handler)
  }

  // Handle disconnect
  socket.on('disconnect', () => {
    if (currentGameId && currentPlayerId) {
      try {
        const game = engine.disconnectPlayer(currentGameId, socket.id)
        broadcastPlayerStatus(io, game)
      } catch {
        // Game may have been deleted
      }
    }
  })

  return handlers // for testing
}
