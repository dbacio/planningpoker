'use client'

interface AcceptButtonsProps {
  revealedBets: { playerId: string; playerName: string; value: number | 'all_in' }[] | null
  onAccept: (value: number) => void
  onShelve: () => void
  onEndGame: () => void
  phase: string | null
  remainingCapacity: number
}

export function AcceptButtons({ revealedBets, onAccept, onShelve, onEndGame, phase, remainingCapacity }: AcceptButtonsProps) {
  if (!revealedBets || phase !== 'ACCEPT') return null

  const numericBets = revealedBets
    .map((b) => b.value)
    .filter((v): v is number => typeof v === 'number')
  const uniqueValues = [...new Set(numericBets)].sort((a, b) => a - b)

  // Count votes per value to identify majority
  const voteCounts = new Map<number, number>()
  numericBets.forEach((v) => voteCounts.set(v, (voteCounts.get(v) ?? 0) + 1))
  const maxVotes = Math.max(...voteCounts.values())

  const capacityIsZero = remainingCapacity <= 0

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Capacity warning */}
      {remainingCapacity <= 5 && remainingCapacity > 0 && (
        <div className="text-yellow-400 text-sm font-medium bg-yellow-900/20 border border-yellow-700 rounded-md px-4 py-2">
          ⚠ Low capacity: {remainingCapacity} pts remaining
        </div>
      )}

      {capacityIsZero ? (
        <div className="text-center space-y-3">
          <div className="text-poker-red text-sm font-bold bg-red-900/20 border border-poker-red rounded-md px-4 py-3">
            Sprint capacity is at 0. The sprint is full.
          </div>
          <button
            onClick={onEndGame}
            className="px-6 py-3 bg-poker-red text-white font-bold rounded-md hover:opacity-90"
          >
            End Game
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-3 flex-wrap justify-center">
            {uniqueValues.map((value) => {
              const isMajority = voteCounts.get(value) === maxVotes
              const wouldOverflow = value > remainingCapacity
              return (
                <div key={value} className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => {
                      if (wouldOverflow) {
                        if (confirm(`Accepting ${value} pts would exceed capacity by ${value - remainingCapacity} pts. The sprint will be over-committed. Continue?`)) {
                          onAccept(value)
                        }
                      } else {
                        onAccept(value)
                      }
                    }}
                    className={`px-6 py-3 rounded-md font-bold text-sm ${
                      wouldOverflow
                        ? 'bg-yellow-600 text-white'
                        : isMajority
                          ? 'bg-poker-green text-poker-bg'
                          : 'bg-poker-red text-white'
                    } hover:opacity-90`}
                  >
                    Accept {value} pts
                  </button>
                  {wouldOverflow && (
                    <span className="text-yellow-400 text-xs">Over capacity!</span>
                  )}
                </div>
              )
            })}
          </div>
          <button
            onClick={onShelve}
            className="px-6 py-3 rounded-md border border-poker-muted text-poker-muted hover:border-white hover:text-white"
          >
            Shelve Story
          </button>
        </>
      )}
    </div>
  )
}
