import { describe, it, expect, beforeEach } from 'vitest'
import { GameEngine } from './game-engine'
import type { Story } from '@/types/game'

const testStories: Story[] = [
  { id: 's1', title: 'Login', description: 'Build login', storyPoints: null, tags: ['frontend'], priority: 'P1', assignee: null, acceptedValue: null },
  { id: 's2', title: 'API', description: 'Build API', storyPoints: null, tags: ['backend'], priority: 'P1', assignee: null, acceptedValue: null },
  { id: 's3', title: 'Tests', description: 'Write tests', storyPoints: 3, tags: ['frontend'], priority: 'P2', assignee: null, acceptedValue: null },
]

describe('GameEngine', () => {
  let engine: GameEngine

  beforeEach(() => {
    engine = new GameEngine()
  })

  describe('createGame', () => {
    it('creates a game in LOBBY phase', () => {
      const game = engine.createGame('d1', 'ds1', 40, testStories)
      expect(game.phase).toBe('LOBBY')
      expect(game.sprintCapacity).toBe(40)
      expect(game.deck).toHaveLength(3)
    })
  })

  describe('addPlayer', () => {
    it('adds a player to the game', () => {
      const game = engine.createGame('d1', 'ds1', 40, testStories)
      engine.addPlayer(game.id, 'p1', 'ps1', 'Alice')
      const updated = engine.getGame(game.id)!
      expect(updated.players).toHaveLength(1)
      expect(updated.players[0].name).toBe('Alice')
    })

    it('rejects duplicate player names', () => {
      const game = engine.createGame('d1', 'ds1', 40, testStories)
      engine.addPlayer(game.id, 'p1', 'ps1', 'Alice')
      expect(() => engine.addPlayer(game.id, 'p2', 'ps2', 'Alice')).toThrow()
    })
  })

  describe('selectStory', () => {
    it('sets currentStory and transitions to DEALING then BETTING', () => {
      const game = engine.createGame('d1', 'ds1', 40, testStories)
      engine.addPlayer(game.id, 'p1', 'ps1', 'Alice')
      const result = engine.selectStory(game.id, 's1')
      expect(result.currentStory?.id).toBe('s1')
      expect(result.phase).toBe('BETTING')
    })

    it('computes river from estimated stories', () => {
      const game = engine.createGame('d1', 'ds1', 40, testStories)
      engine.addPlayer(game.id, 'p1', 'ps1', 'Alice')
      // s3 has storyPoints: 3 and tags: ['frontend'], same as s1
      const result = engine.selectStory(game.id, 's1')
      expect(result.river).toContain(3)
    })
  })

  describe('submitBet', () => {
    it('records a player bet', () => {
      const game = engine.createGame('d1', 'ds1', 40, testStories)
      engine.addPlayer(game.id, 'p1', 'ps1', 'Alice')
      engine.selectStory(game.id, 's1')
      engine.submitBet(game.id, 'p1', 5)
      const updated = engine.getGame(game.id)!
      expect(updated.players[0].currentBet).toBe(5)
    })

    it('transitions to ACCEPT (via auto-REVEAL) when all players have bet', () => {
      const game = engine.createGame('d1', 'ds1', 40, testStories)
      engine.addPlayer(game.id, 'p1', 'ps1', 'Alice')
      engine.addPlayer(game.id, 'p2', 'ps2', 'Bob')
      engine.selectStory(game.id, 's1')
      engine.submitBet(game.id, 'p1', 5)
      const result = engine.submitBet(game.id, 'p2', 3)
      // submitBet auto-transitions REVEAL → ACCEPT via cards-shown
      expect(result.phase).toBe('ACCEPT')
    })

    it('transitions to ALL_IN_PAUSE when any player goes all in', () => {
      const game = engine.createGame('d1', 'ds1', 40, testStories)
      engine.addPlayer(game.id, 'p1', 'ps1', 'Alice')
      engine.addPlayer(game.id, 'p2', 'ps2', 'Bob')
      engine.selectStory(game.id, 's1')
      engine.submitBet(game.id, 'p1', 'all_in')
      const result = engine.submitBet(game.id, 'p2', 5)
      expect(result.phase).toBe('ALL_IN_PAUSE')
    })
  })

  describe('acceptValue', () => {
    it('scores players who matched, moves story to estimated', () => {
      const game = engine.createGame('d1', 'ds1', 40, testStories)
      engine.addPlayer(game.id, 'p1', 'ps1', 'Alice')
      engine.addPlayer(game.id, 'p2', 'ps2', 'Bob')
      engine.selectStory(game.id, 's1')
      engine.submitBet(game.id, 'p1', 5)
      engine.submitBet(game.id, 'p2', 3)
      // Now in REVEAL → auto-transition to ACCEPT
      const result = engine.acceptValue(game.id, 5)
      const updated = engine.getGame(game.id)!
      expect(updated.players.find((p) => p.id === 'p1')!.score).toBe(1)
      expect(updated.players.find((p) => p.id === 'p2')!.score).toBe(0)
      expect(updated.remainingCapacity).toBe(35)
      expect(updated.estimated).toHaveLength(1)
      expect(updated.currentStory).toBeNull()
    })

    it('records round history', () => {
      const game = engine.createGame('d1', 'ds1', 40, testStories)
      engine.addPlayer(game.id, 'p1', 'ps1', 'Alice')
      engine.selectStory(game.id, 's1')
      engine.submitBet(game.id, 'p1', 5)
      engine.acceptValue(game.id, 5)
      const updated = engine.getGame(game.id)!
      expect(updated.rounds).toHaveLength(1)
      expect(updated.rounds[0].acceptedValue).toBe(5)
    })
  })

  describe('reopenHand', () => {
    it('clears all bets and returns to BETTING', () => {
      const game = engine.createGame('d1', 'ds1', 40, testStories)
      engine.addPlayer(game.id, 'p1', 'ps1', 'Alice')
      engine.addPlayer(game.id, 'p2', 'ps2', 'Bob')
      engine.selectStory(game.id, 's1')
      engine.submitBet(game.id, 'p1', 'all_in')
      engine.submitBet(game.id, 'p2', 5)
      // Now in ALL_IN_PAUSE
      const result = engine.reopenHand(game.id)
      expect(result.phase).toBe('BETTING')
      expect(result.players.every((p) => p.currentBet === null)).toBe(true)
    })
  })

  describe('shelveStory', () => {
    it('returns story to deck and transitions to DEALING', () => {
      const game = engine.createGame('d1', 'ds1', 40, testStories)
      engine.addPlayer(game.id, 'p1', 'ps1', 'Alice')
      engine.selectStory(game.id, 's1')
      engine.submitBet(game.id, 'p1', 'all_in')
      const result = engine.shelveStory(game.id)
      expect(result.phase).toBe('DEALING')
      expect(result.deck.find((s) => s.id === 's1')).toBeTruthy()
      expect(result.currentStory).toBeNull()
    })
  })

  describe('initAuction', () => {
    it('gives each player 5 auction chips', () => {
      const game = engine.createGame('d1', 'ds1', 40, testStories)
      engine.addPlayer(game.id, 'p1', 'ps1', 'Alice')
      engine.addPlayer(game.id, 'p2', 'ps2', 'Bob')
      engine.initAuction(game.id)
      const updated = engine.getGame(game.id)!
      expect(updated.auctionChips.get('p1')).toBe(5)
      expect(updated.auctionChips.get('p2')).toBe(5)
      expect(updated.players[0].auctionChips).toBe(5)
    })
  })

  describe('endGame', () => {
    it('transitions to GAME_OVER from any state', () => {
      const game = engine.createGame('d1', 'ds1', 40, testStories)
      engine.addPlayer(game.id, 'p1', 'ps1', 'Alice')
      const result = engine.endGame(game.id)
      expect(result.phase).toBe('GAME_OVER')
    })
  })
})
