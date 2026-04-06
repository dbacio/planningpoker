'use client'
import { StoryCard } from '@/components/shared/StoryCard'
import { River } from '@/components/shared/River'
import { PlayerCards } from '@/components/shared/PlayerCards'
import { AcceptButtons } from './AcceptButtons'
import type { GameState } from '@/hooks/useGameState'

interface DealerTableProps {
  state: GameState
  onAccept: (value: number) => void
  onShelve: () => void
  onReopen: () => void
  onEndGame: () => void
}

export function DealerTable({ state, onAccept, onShelve, onReopen, onEndGame }: DealerTableProps) {
  return (
    <div className="flex flex-col items-center gap-5 p-5 flex-1 overflow-y-auto">
      <StoryCard
        story={state.currentStory}
        fullStory={state.currentStoryFull}
      />

      <River values={state.river} />

      <PlayerCards
        players={state.players}
        revealedBets={state.revealedBets}
      />

      {state.phase === 'ACCEPT' && (
        <AcceptButtons
          revealedBets={state.revealedBets}
          onAccept={onAccept}
          onShelve={onShelve}
          onEndGame={onEndGame}
          phase={state.phase}
          remainingCapacity={state.remainingCapacity}
        />
      )}

      {state.phase === 'ALL_IN_PAUSE' && (
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <div className="w-full text-center p-4 bg-poker-red/10 border-2 border-poker-red rounded-xl">
            <div className="text-poker-red text-lg font-bold">All In Called</div>
            <div className="text-white/80 mt-1 text-sm">A player went All In — discussion in progress</div>
          </div>
          <div className="flex gap-3">
            <button onClick={onReopen} className="px-6 py-3 bg-poker-green text-poker-bg font-bold rounded-md hover:opacity-90">
              Reopen Hand
            </button>
            <button onClick={onShelve} className="px-6 py-3 border border-poker-muted text-poker-muted rounded-md hover:border-white hover:text-white">
              Shelve Story
            </button>
          </div>
        </div>
      )}

      {state.phase === 'BETTING' && (
        <div className="text-poker-muted text-sm">Waiting for all players to submit estimates...</div>
      )}
    </div>
  )
}
