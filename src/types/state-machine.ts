import type { GamePhase } from './game'

export type GameEvent =
  | 'dealer:select-story'
  | 'dealer:accept'
  | 'dealer:reopen'
  | 'dealer:shelve'
  | 'dealer:end-game'
  | 'dealer:start-auction'
  | 'all-players-submitted'
  | 'all-in-detected'
  | 'auction-resolved'
  | 'story-displayed'
  | 'cards-shown'

export interface Transition {
  event: GameEvent
  target: GamePhase
}
