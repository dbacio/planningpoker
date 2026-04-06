'use client'

interface TopBarProps {
  remainingCapacity: number
  sprintCapacity: number
  deckCount: number
  estimatedCount: number
  gameId: string | null
  playerName?: string
}

export function TopBar({ remainingCapacity, sprintCapacity, deckCount, estimatedCount, gameId, playerName }: TopBarProps) {
  const totalStories = deckCount + estimatedCount
  const currentRound = estimatedCount + 1

  return (
    <div className="flex justify-between items-center px-5 py-3 bg-poker-surface border-b border-poker-card">
      <div className="text-lg font-bold text-poker-red">Sprint Poker</div>
      <div className="flex gap-6 text-sm">
        <div>
          <span className="text-poker-muted">Capacity: </span>
          <span className="text-poker-green font-bold text-base">{remainingCapacity}</span>
          <span className="text-gray-600"> / {sprintCapacity} pts</span>
        </div>
        <div>
          <span className="text-poker-muted">Stories left: </span>
          <span className="text-poker-red font-bold text-base">{deckCount}</span>
        </div>
        <div>
          <span className="text-poker-muted">Round: </span>
          <span className="font-bold">{currentRound} of {totalStories}</span>
        </div>
      </div>
      <div className="text-sm">
        {playerName ? (
          <span>Playing as <span className="text-poker-green font-bold">{playerName}</span></span>
        ) : (
          <span className="text-poker-muted">Room: {gameId?.slice(0, 8)}</span>
        )}
      </div>
    </div>
  )
}
