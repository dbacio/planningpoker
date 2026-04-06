import { describe, it, expect, beforeEach } from 'vitest'
import { GameStore } from './game-store'
import type { Dealer } from '@/types/game'

describe('GameStore', () => {
  let store: GameStore

  beforeEach(() => {
    store = new GameStore()
  })

  it('creates a new game with a unique ID', () => {
    const dealer: Dealer = { id: 'd1', socketId: 's1' }
    const game = store.createGame(dealer, 40)
    expect(game.id).toBeTruthy()
    expect(game.phase).toBe('LOBBY')
    expect(game.sprintCapacity).toBe(40)
    expect(game.remainingCapacity).toBe(40)
    expect(game.dealer).toEqual(dealer)
    expect(game.players).toEqual([])
    expect(game.deck).toEqual([])
  })

  it('retrieves a game by ID', () => {
    const dealer: Dealer = { id: 'd1', socketId: 's1' }
    const game = store.createGame(dealer, 40)
    const retrieved = store.getGame(game.id)
    expect(retrieved).toEqual(game)
  })

  it('returns undefined for unknown game ID', () => {
    expect(store.getGame('nonexistent')).toBeUndefined()
  })

  it('deletes a game by ID', () => {
    const dealer: Dealer = { id: 'd1', socketId: 's1' }
    const game = store.createGame(dealer, 40)
    store.deleteGame(game.id)
    expect(store.getGame(game.id)).toBeUndefined()
  })

  it('generates unique IDs across multiple games', () => {
    const dealer: Dealer = { id: 'd1', socketId: 's1' }
    const ids = new Set<string>()
    for (let i = 0; i < 20; i++) {
      ids.add(store.createGame(dealer, 40).id)
    }
    expect(ids.size).toBe(20)
  })
})
