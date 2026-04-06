'use client'

interface AuctionDealerControlsProps {
  deckStories: { id: string; title: string }[]
  onPresentItem: (storyId: string) => void
  onEndGame: () => void
  remainingCapacity: number
}

export function AuctionDealerControls({ deckStories, onPresentItem, onEndGame, remainingCapacity }: AuctionDealerControlsProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-5">
      <div className="text-lg font-bold text-poker-green">Auction Phase</div>
      <div className="text-sm text-poker-muted">Remaining capacity: {remainingCapacity} pts</div>

      {deckStories.length > 0 ? (
        <div className="space-y-2 w-full max-w-md">
          <div className="text-xs uppercase text-poker-muted">Select an item to auction:</div>
          {deckStories.map((story) => (
            <button
              key={story.id}
              onClick={() => onPresentItem(story.id)}
              className="w-full text-left p-3 bg-poker-card rounded-md hover:border-poker-green border border-transparent transition-colors"
            >
              {story.title}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-poker-muted">No more items to auction</div>
      )}

      <button onClick={onEndGame} className="px-6 py-3 bg-poker-red text-white font-bold rounded-md hover:opacity-90 mt-4">
        End Game
      </button>
    </div>
  )
}
