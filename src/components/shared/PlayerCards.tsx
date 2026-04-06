'use client'
import type { PlayerStatus } from '@/types/events'

interface PlayerCardsProps {
  players: PlayerStatus[]
  revealedBets: { playerId: string; playerName: string; value: number | 'all_in' }[] | null
  acceptedValue?: number | null
  myPlayerId?: string | null
  myBet?: number | 'all_in' | null
}

export function PlayerCards({ players, revealedBets, acceptedValue, myPlayerId, myBet }: PlayerCardsProps) {
  return (
    <div className="text-center">
      <div className="text-xs uppercase text-poker-muted tracking-widest mb-3">The Table</div>
      <div className="flex gap-4 justify-center flex-wrap">
        {players.map((player) => {
          const revealed = revealedBets?.find((b) => b.playerId === player.id)
          const isMe = myPlayerId && player.id === myPlayerId

          // All cards revealed (REVEAL/ACCEPT phase)
          if (revealed) {
            const matched = acceptedValue !== null && acceptedValue !== undefined && revealed.value === acceptedValue
            return (
              <div key={player.id} className="text-center">
                <div className={`w-14 h-20 rounded-md flex items-center justify-center text-xl font-bold ${
                  matched ? 'bg-poker-green text-poker-bg' : 'bg-poker-red text-white'
                }`}>
                  {revealed.value === 'all_in' ? '!' : revealed.value}
                </div>
                <div className={`text-xs mt-1 ${isMe ? 'text-poker-green font-bold' : 'text-gray-400'}`}>
                  {player.name}{isMe ? ' (you)' : ''}
                </div>
              </div>
            )
          }

          // During BETTING: show own card face-up, others face-down
          if (isMe && myBet !== null && myBet !== undefined) {
            return (
              <div key={player.id} className="text-center">
                <div className="w-14 h-20 bg-poker-card border-2 border-poker-green rounded-md flex items-center justify-center text-xl font-bold text-poker-green">
                  {myBet === 'all_in' ? '!' : myBet}
                </div>
                <div className="text-xs text-poker-green font-bold mt-1">{player.name} (you)</div>
              </div>
            )
          }

          return (
            <div key={player.id} className="text-center">
              {player.hasVoted ? (
                <div className="w-14 h-20 bg-poker-red rounded-md flex items-center justify-center text-sm text-white/60"
                  style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 6px)' }}>
                  &#10003;
                </div>
              ) : (
                <div className="w-14 h-20 bg-gray-800 border border-dashed border-gray-600 rounded-md flex items-center justify-center">
                  <div className="w-2 h-2 border border-gray-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className={`text-xs mt-1 ${isMe ? 'text-poker-green font-bold' : player.hasVoted ? 'text-poker-green' : 'text-poker-red'}`}>
                {player.name}{isMe ? ' (you)' : ''}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
