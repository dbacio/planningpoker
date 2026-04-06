'use client'
import type { GameOverPayload } from '@/types/events'
import { ConfettiAnimation } from '@/components/shared/ConfettiAnimation'
import { ExportButtons } from './ExportButtons'

interface GameOverScreenProps {
  gameOver: GameOverPayload
  gameId: string
  isDealer?: boolean
}

export function GameOverScreen({ gameOver, gameId, isDealer }: GameOverScreenProps) {
  const sorted = [...gameOver.players].sort((a, b) => b.finalScore - a.finalScore)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <ConfettiAnimation />

      <div className="text-center">
        <div className="text-poker-muted text-sm uppercase tracking-widest">Game Over</div>
        <div className="text-4xl font-bold text-poker-green mt-2">{gameOver.winner} wins!</div>
      </div>

      <div className="bg-poker-surface rounded-xl p-6 w-full max-w-md">
        <div className="text-xs uppercase text-poker-muted tracking-widest mb-4">Final Scores</div>
        <div className="space-y-3">
          {sorted.map((player, i) => (
            <div key={player.name} className="flex justify-between items-center p-3 bg-poker-card rounded-md">
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${i === 0 ? 'text-poker-green' : 'text-poker-muted'}`}>
                  #{i + 1}
                </span>
                <span className="font-semibold">{player.name}</span>
              </div>
              <span className="text-lg font-bold text-poker-green">{player.finalScore} pts</span>
            </div>
          ))}
        </div>
      </div>

      {isDealer && <ExportButtons gameId={gameId} />}

      <a href="/" className="text-poker-muted hover:text-white text-sm">
        Start a new game
      </a>
    </div>
  )
}
