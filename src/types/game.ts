export type GamePhase =
  | 'LOBBY'
  | 'DEALING'
  | 'BETTING'
  | 'REVEAL'
  | 'ALL_IN_PAUSE'
  | 'ACCEPT'
  | 'AUCTION_PRESENT'
  | 'AUCTION_BID'
  | 'AUCTION_WON'
  | 'GAME_OVER'

export interface Story {
  id: string
  title: string
  description: string
  storyPoints: number | null
  tags: string[]
  priority: string
  assignee: string | null
  acceptedValue: number | null
}

export interface Player {
  id: string
  socketId: string
  name: string
  score: number
  currentBet: number | 'all_in' | null
  auctionChips: number
  connected: boolean
}

export interface Dealer {
  id: string
  socketId: string
}

export interface RoundHistory {
  storyId: string
  storyTitle: string
  storyDescription: string
  phase: 'estimation' | 'auction'
  bets: { playerId: string; playerName: string; value: number | 'all_in' }[]
  acceptedValue: number | null
  river: number[]
  wasAllIn: boolean
  wasReopened: boolean
  shelved: boolean
  auctionWinner: string | null
  tied: boolean
  tiedPlayers: string[]
}

export interface Game {
  id: string
  phase: GamePhase
  sprintCapacity: number
  remainingCapacity: number
  deck: Story[]
  estimated: Story[]
  currentStory: Story | null
  river: number[]
  players: Player[]
  dealer: Dealer
  auctionChips: Map<string, number>
  rounds: RoundHistory[]
}

export const FIBONACCI_SCALE = [1, 2, 3, 5, 8, 13, 21] as const
export const AUCTION_STARTING_CHIPS = 5

export interface GameReport {
  gameId: string
  date: string
  sprintCapacity: number
  capacityUsed: number
  players: { name: string; finalScore: number }[]
  winner: string
  estimationRounds: {
    storyTitle: string
    storyDescription: string
    river: number[]
    bets: { player: string; value: number | 'all_in' }[]
    acceptedValue: number | null
    wasReopened: boolean
    shelved: boolean
  }[]
  auctionRounds: {
    storyTitle: string
    bids: { player: string; amount: number; folded: boolean }[]
    winner: string | null
    tied: boolean
    tiedPlayers: string[]
    finalBid: number | null
  }[]
  unestimatedStories: string[]
}
