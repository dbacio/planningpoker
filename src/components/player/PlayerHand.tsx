'use client'
import { FIBONACCI_SCALE } from '@/types/game'

interface PlayerHandProps {
  onBet: (value: number | 'all_in') => void
  currentBet: number | 'all_in' | null
  disabled: boolean
}

export function PlayerHand({ onBet, currentBet, disabled }: PlayerHandProps) {
  return (
    <div className="w-full max-w-xl bg-poker-surface rounded-xl p-5 border-t-3 border-poker-red">
      <div className="text-xs uppercase text-poker-muted tracking-widest mb-3 text-center">Your Hand — Select a Card</div>
      <div className="flex gap-2 justify-center flex-wrap">
        {FIBONACCI_SCALE.map((value) => {
          const selected = currentBet === value
          return (
            <button
              key={value}
              onClick={() => onBet(value)}
              disabled={disabled}
              className={`w-14 h-20 rounded-lg text-xl font-bold transition-all ${
                selected
                  ? 'bg-poker-green text-poker-bg -translate-y-1.5 shadow-lg shadow-poker-green/30 border-2 border-poker-green'
                  : 'bg-poker-card border-2 border-gray-700 text-gray-200 hover:border-gray-500'
              } disabled:opacity-50`}
            >
              {value}
            </button>
          )
        })}
        <button
          onClick={() => onBet('all_in')}
          disabled={disabled}
          className={`w-18 h-20 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
            currentBet === 'all_in'
              ? 'bg-poker-red text-white -translate-y-1.5 shadow-lg shadow-poker-red/30 border-2 border-poker-red'
              : 'bg-poker-bg border-2 border-poker-red text-poker-red hover:bg-poker-red/10'
          } disabled:opacity-50`}
        >
          All<br />In
        </button>
      </div>
      {currentBet !== null && (
        <div className="text-center mt-3 text-sm text-poker-green">
          You selected: <strong>{currentBet === 'all_in' ? 'All In' : currentBet}</strong>
        </div>
      )}
    </div>
  )
}
