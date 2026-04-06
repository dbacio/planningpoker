import { describe, it, expect } from 'vitest'
import { generateJSONReport, generateCSVReport } from './export'
import type { Game, Player, RoundHistory, Story } from '@/types/game'

function makeTestGame(): Game {
  const players: Player[] = [
    { id: 'p1', socketId: 's1', name: 'Alice', score: 3, currentBet: null, auctionChips: 4, connected: true },
    { id: 'p2', socketId: 's2', name: 'Bob', score: 1, currentBet: null, auctionChips: 5, connected: true },
  ]

  const rounds: RoundHistory[] = [
    {
      storyId: 's1', storyTitle: 'Login page', storyDescription: 'Build login', phase: 'estimation', river: [3, 5],
      bets: [
        { playerId: 'p1', playerName: 'Alice', value: 5 },
        { playerId: 'p2', playerName: 'Bob', value: 5 },
      ],
      acceptedValue: 5, wasAllIn: false, wasReopened: false, shelved: false,
      auctionWinner: null, tied: false, tiedPlayers: [],
    },
    {
      storyId: 's2', storyTitle: 'API endpoint', storyDescription: 'Build API', phase: 'estimation', river: [5],
      bets: [
        { playerId: 'p1', playerName: 'Alice', value: 3 },
        { playerId: 'p2', playerName: 'Bob', value: 8 },
      ],
      acceptedValue: 3, wasAllIn: false, wasReopened: false, shelved: false,
      auctionWinner: null, tied: false, tiedPlayers: [],
    },
    {
      storyId: 'a1', storyTitle: 'Cache layer', storyDescription: 'Add caching', phase: 'auction', river: [],
      bets: [
        { playerId: 'p1', playerName: 'Alice', value: 3 },
        { playerId: 'p2', playerName: 'Bob', value: 2 },
      ],
      acceptedValue: 3, wasAllIn: false, wasReopened: false, shelved: false,
      auctionWinner: 'Alice', tied: false, tiedPlayers: [],
    },
  ]

  const deck: Story[] = [
    { id: 'u1', title: 'Unestimated task', description: '', storyPoints: null, tags: [], priority: 'P3', assignee: null, acceptedValue: null },
  ]

  return {
    id: 'game123',
    phase: 'GAME_OVER',
    sprintCapacity: 40,
    remainingCapacity: 29,
    deck,
    estimated: [],
    currentStory: null,
    river: [],
    players,
    dealer: { id: 'd1', socketId: 'ds1' },
    auctionChips: new Map([['p1', 4], ['p2', 5]]),
    rounds,
  }
}

describe('generateJSONReport', () => {
  it('includes game metadata', () => {
    const report = generateJSONReport(makeTestGame())
    expect(report.gameId).toBe('game123')
    expect(report.sprintCapacity).toBe(40)
    expect(report.capacityUsed).toBe(11)
  })

  it('identifies the winner', () => {
    const report = generateJSONReport(makeTestGame())
    expect(report.winner).toBe('Alice')
    expect(report.players[0].finalScore).toBeGreaterThanOrEqual(report.players[1].finalScore)
  })

  it('separates estimation and auction rounds', () => {
    const report = generateJSONReport(makeTestGame())
    expect(report.estimationRounds).toHaveLength(2)
    expect(report.auctionRounds).toHaveLength(1)
  })

  it('includes unestimated stories', () => {
    const report = generateJSONReport(makeTestGame())
    expect(report.unestimatedStories).toContain('Unestimated task')
  })
})

describe('generateCSVReport', () => {
  it('generates CSV with header row', () => {
    const csv = generateCSVReport(makeTestGame())
    const lines = csv.trim().split('\n')
    expect(lines[0]).toContain('round')
    expect(lines[0]).toContain('phase')
    expect(lines[0]).toContain('story_title')
    expect(lines[0]).toContain('Alice')
    expect(lines[0]).toContain('Bob')
  })

  it('has one data row per round', () => {
    const csv = generateCSVReport(makeTestGame())
    const lines = csv.trim().split('\n')
    expect(lines.length).toBe(4) // header + 3 rounds
  })

  it('includes notes for special rounds', () => {
    const game = makeTestGame()
    game.rounds[0].wasAllIn = true
    const csv = generateCSVReport(game)
    expect(csv).toContain('all_in triggered')
  })
})
