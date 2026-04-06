'use client'
import type { PlayerStatus } from '@/types/events'

interface PlayerRosterProps {
  players: PlayerStatus[]
  estimated: { title: string; acceptedValue: number }[]
}

export function PlayerRoster({ players, estimated }: PlayerRosterProps) {
  return (
    <div className="bg-poker-surface p-4 border-l border-poker-card overflow-y-auto">
      <div className="text-xs uppercase text-poker-muted tracking-widest mb-3">Players</div>
      <div className="flex flex-col gap-2">
        {players.map((player) => (
          <div key={player.id} className="flex justify-between items-center p-2 bg-poker-card rounded-md">
            <div>
              <div className="text-sm font-semibold">{player.name}</div>
              <div className={`text-xs ${player.hasVoted ? 'text-poker-green' : player.connected ? 'text-poker-red' : 'text-gray-600'}`}>
                {!player.connected ? 'Disconnected' : player.hasVoted ? 'Voted' : 'Waiting...'}
              </div>
            </div>
            <div className="text-base font-bold text-poker-green">{player.score} pts</div>
          </div>
        ))}
        {players.length === 0 && (
          <div className="text-sm text-poker-muted text-center py-4">Waiting for players...</div>
        )}
      </div>

      {estimated.length > 0 && (
        <div className="mt-5 pt-4 border-t border-poker-card">
          <div className="text-xs uppercase text-poker-muted tracking-widest mb-2">Estimated</div>
          <div className="text-sm text-gray-400 space-y-1">
            {estimated.map((s, i) => (
              <div key={i} className="flex justify-between">
                <span className="truncate">{s.title}</span>
                <span className="text-poker-green ml-2">{s.acceptedValue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
