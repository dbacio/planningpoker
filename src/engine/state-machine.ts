import type { GamePhase } from '@/types/game'
import type { GameEvent, Transition } from '@/types/state-machine'

export class InvalidTransitionError extends Error {
  constructor(state: GamePhase, event: GameEvent) {
    super(`Invalid transition: cannot handle '${event}' in state '${state}'`)
    this.name = 'InvalidTransitionError'
  }
}

const TRANSITIONS: Record<GamePhase, Transition[]> = {
  LOBBY: [
    { event: 'dealer:select-story', target: 'DEALING' },
    { event: 'dealer:end-game', target: 'GAME_OVER' },
  ],
  DEALING: [
    { event: 'story-displayed', target: 'BETTING' },
    { event: 'dealer:end-game', target: 'GAME_OVER' },
  ],
  BETTING: [
    { event: 'all-players-submitted', target: 'REVEAL' },
    { event: 'all-in-detected', target: 'ALL_IN_PAUSE' },
    { event: 'dealer:end-game', target: 'GAME_OVER' },
  ],
  REVEAL: [
    { event: 'cards-shown', target: 'ACCEPT' },
    { event: 'dealer:end-game', target: 'GAME_OVER' },
  ],
  ALL_IN_PAUSE: [
    { event: 'dealer:reopen', target: 'BETTING' },
    { event: 'dealer:shelve', target: 'DEALING' },
    { event: 'dealer:end-game', target: 'GAME_OVER' },
  ],
  ACCEPT: [
    { event: 'dealer:select-story', target: 'DEALING' },
    { event: 'dealer:start-auction', target: 'AUCTION_PRESENT' },
    { event: 'dealer:end-game', target: 'GAME_OVER' },
  ],
  AUCTION_PRESENT: [
    { event: 'story-displayed', target: 'AUCTION_BID' },
    { event: 'dealer:end-game', target: 'GAME_OVER' },
  ],
  AUCTION_BID: [
    { event: 'auction-resolved', target: 'AUCTION_WON' },
    { event: 'dealer:end-game', target: 'GAME_OVER' },
  ],
  AUCTION_WON: [
    { event: 'dealer:start-auction', target: 'AUCTION_PRESENT' },
    { event: 'dealer:end-game', target: 'GAME_OVER' },
  ],
  GAME_OVER: [],
}

export function createStateMachine(initialState: GamePhase = 'LOBBY') {
  let _state = initialState

  return {
    get currentState(): GamePhase {
      return _state
    },

    transition(event: GameEvent): GamePhase {
      const transitions = TRANSITIONS[_state]
      const match = transitions.find((t) => t.event === event)
      if (!match) {
        throw new InvalidTransitionError(_state, event)
      }
      _state = match.target
      return _state
    },

    getValidEvents(): GameEvent[] {
      return TRANSITIONS[_state].map((t) => t.event)
    },
  }
}
