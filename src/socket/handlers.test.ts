import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GameEngine } from '@/engine/game-engine'
import { registerHandlers } from './handlers'
import type { Story } from '@/types/game'

// Mock Socket.IO socket
function createMockSocket(id = 'socket1') {
  return {
    id,
    join: vi.fn(),
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
    on: vi.fn(),
    data: {} as Record<string, unknown>,
  }
}

function createMockIO() {
  return {
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
    in: vi.fn().mockReturnThis(),
  }
}

const testStories: Story[] = [
  { id: 's1', title: 'Login', description: 'Build login', storyPoints: null, tags: ['frontend'], priority: 'P1', assignee: null, acceptedValue: null },
]

describe('Socket Handlers', () => {
  let engine: GameEngine
  let mockIO: ReturnType<typeof createMockIO>

  beforeEach(() => {
    engine = new GameEngine()
    mockIO = createMockIO()
  })

  it('handles dealer:create-game event', () => {
    const socket = createMockSocket('dealer-socket')
    const handlers = registerHandlers(mockIO as any, socket as any, engine)

    handlers['dealer:create-game']({ sprintCapacity: 40, stories: testStories })

    expect(socket.join).toHaveBeenCalled()
    expect(socket.emit).toHaveBeenCalledWith('game:state', expect.objectContaining({
      phase: 'LOBBY',
      sprintCapacity: 40,
    }))
  })

  it('handles player:join event', () => {
    const dealerSocket = createMockSocket('dealer-socket')
    const handlers = registerHandlers(mockIO as any, dealerSocket as any, engine)
    handlers['dealer:create-game']({ sprintCapacity: 40, stories: testStories })

    const gameId = (dealerSocket.emit.mock.calls[0][1] as any).gameId
    const playerSocket = createMockSocket('player-socket')
    const playerHandlers = registerHandlers(mockIO as any, playerSocket as any, engine)

    playerHandlers['player:join']({ name: 'Alice', gameId })

    expect(playerSocket.join).toHaveBeenCalledWith(gameId)
    expect(playerSocket.emit).toHaveBeenCalledWith('game:state', expect.objectContaining({
      gameId,
    }))
  })

  it('handles player:bet event and broadcasts status', () => {
    const dealerSocket = createMockSocket('dealer-socket')
    const handlers = registerHandlers(mockIO as any, dealerSocket as any, engine)
    handlers['dealer:create-game']({ sprintCapacity: 40, stories: testStories })

    const gameId = (dealerSocket.emit.mock.calls[0][1] as any).gameId
    const playerSocket = createMockSocket('player-socket')
    const playerHandlers = registerHandlers(mockIO as any, playerSocket as any, engine)
    playerHandlers['player:join']({ name: 'Alice', gameId })

    // Dealer selects story
    handlers['dealer:select-story']({ storyId: 's1' })

    // Player bets
    playerHandlers['player:bet']({ value: 5 })

    // Should broadcast player status to room
    expect(mockIO.to).toHaveBeenCalledWith(gameId)
  })

  it('emits error on invalid actions', () => {
    const socket = createMockSocket('socket1')
    const handlers = registerHandlers(mockIO as any, socket as any, engine)

    // Try to bet without a game
    handlers['player:bet']({ value: 5 })

    expect(socket.emit).toHaveBeenCalledWith('game:error', expect.objectContaining({
      message: expect.any(String),
    }))
  })
})
