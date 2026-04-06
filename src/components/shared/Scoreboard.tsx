'use client'

interface ScoreboardProps {
  scores: { id: string; name: string; score: number }[]
  currentPlayerId?: string
}

export function Scoreboard({ scores, currentPlayerId }: ScoreboardProps) {
  return (
    <div className="flex justify-center gap-5 px-5 py-3 bg-poker-surface border-t border-poker-card text-sm">
      {scores.map((p) => (
        <div key={p.id}>
          <span className={p.id === currentPlayerId ? 'text-poker-green font-bold' : 'text-gray-400'}>
            {p.name}{p.id === currentPlayerId ? ' (you)' : ''}:
          </span>{' '}
          <span>{p.score} pts</span>
        </div>
      ))}
    </div>
  )
}
