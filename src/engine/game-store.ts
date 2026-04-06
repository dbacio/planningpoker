import { randomBytes } from 'crypto'
import type { Game, Dealer } from '@/types/game'

export class GameStore {
  private games = new Map<string, Game>()

  createGame(dealer: Dealer, sprintCapacity: number): Game {
    const id = randomBytes(4).toString('hex')
    const game: Game = {
      id,
      phase: 'LOBBY',
      sprintCapacity,
      remainingCapacity: sprintCapacity,
      deck: [],
      estimated: [],
      currentStory: null,
      river: [],
      players: [],
      dealer,
      auctionChips: new Map(),
      rounds: [],
    }
    this.games.set(id, game)
    return game
  }

  getGame(id: string): Game | undefined {
    return this.games.get(id)
  }

  deleteGame(id: string): void {
    this.games.delete(id)
  }
}
