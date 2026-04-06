import type { Game, GamePhase, Player, Story } from './game'

export interface ClientEvents {
  'player:join': (data: { name: string; gameId: string }) => void
  'player:bet': (data: { value: number | 'all_in' }) => void
  'player:auction-bid': (data: { amount: number; fold?: false } | { fold: true }) => void
  'dealer:create-game': (data: { sprintCapacity: number; csvText?: string; stories?: Story[] }) => void
  'dealer:rejoin': (data: { gameId: string }) => void
  'dealer:select-story': (data: { storyId: string }) => void
  'dealer:accept': (data: { value: number }) => void
  'dealer:reopen': () => void
  'dealer:shelve': () => void
  'dealer:set-river': (data: { values: number[] }) => void
  'dealer:start-auction': () => void
  'dealer:present-auction-item': (data: { storyId: string }) => void
  'dealer:end-game': () => void
}

export interface ServerEvents {
  'game:state': (data: GameStatePayload) => void
  'game:phase': (data: { phase: GamePhase; story?: Story; river?: number[] }) => void
  'game:player-status': (data: { players: PlayerStatus[] }) => void
  'round:reveal': (data: { bets: { playerId: string; playerName: string; value: number | 'all_in' }[] }) => void
  'auction:bid': (data: AuctionBidState) => void
  'game:over': (data: GameOverPayload) => void
  'game:error': (data: { message: string }) => void
  'game:player-joined': (data: { player: PlayerStatus }) => void
  'game:scores': (data: { players: { id: string; name: string; score: number }[] }) => void
}

export interface PlayerStatus {
  id: string
  name: string
  hasVoted: boolean
  connected: boolean
  score: number
}

export interface GameStatePayload {
  gameId: string
  phase: GamePhase
  sprintCapacity: number
  remainingCapacity: number
  deckCount: number
  estimatedCount: number
  currentStory: { title: string; description: string } | null
  currentStoryFull: Story | null
  river: number[]
  players: PlayerStatus[]
  myPlayerId: string | null
  myBet: number | 'all_in' | null
  auctionChips: number | null
  scores: { id: string; name: string; score: number }[]
  dealerDeck?: Story[]
  dealerEstimated?: { title: string; acceptedValue: number }[]
  lastAcceptedValue?: number | null
  lastRoundMatched?: boolean
  lastRoundMyBet?: number | 'all_in' | null
}

export interface AuctionBidState {
  storyTitle: string
  currentBid: number
  currentBidder: string | null
  activePlayers: { id: string; name: string; chips: number; folded: boolean }[]
  whoseTurn: string
}

export interface GameOverPayload {
  players: { name: string; finalScore: number }[]
  winner: string
}
