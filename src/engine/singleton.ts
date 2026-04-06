import { GameEngine } from './game-engine'

// Module-level singleton — shared by server.ts and API routes
const engine = new GameEngine()

export default engine
