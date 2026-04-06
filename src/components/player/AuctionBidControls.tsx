'use client'
import { useState } from 'react'
import type { AuctionBidState } from '@/types/events'

interface AuctionBidControlsProps {
  auctionState: AuctionBidState
  myChips: number
  myPlayerId: string
  onBid: (amount: number) => void
  onFold: () => void
}

export function AuctionBidControls({ auctionState, myChips, myPlayerId, onBid, onFold }: AuctionBidControlsProps) {
  const [bidAmount, setBidAmount] = useState(auctionState.currentBid + 1)
  const isMyTurn = auctionState.whoseTurn === myPlayerId
  const haveFolded = auctionState.activePlayers.find((p) => p.id === myPlayerId)?.folded ?? true

  if (haveFolded) {
    return (
      <div className="text-center p-5">
        <div className="text-poker-muted text-lg">You folded this round</div>
      </div>
    )
  }

  return (
    <div className="bg-poker-surface rounded-xl p-5 w-full max-w-md space-y-4">
      <div className="text-center">
        <div className="text-xs uppercase text-poker-muted tracking-widest">Auction — {auctionState.storyTitle}</div>
        <div className="text-lg mt-2">
          Current bid: <span className="text-poker-green font-bold">{auctionState.currentBid}</span>
          {auctionState.currentBidder && (
            <span className="text-poker-muted"> by {auctionState.currentBidder}</span>
          )}
        </div>
        <div className="text-sm text-poker-muted mt-1">Your chips: <span className="text-poker-green font-bold">{myChips}</span></div>
      </div>

      {isMyTurn ? (
        <div className="flex gap-3 justify-center">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
              min={auctionState.currentBid + 1}
              max={myChips}
              className="w-20 bg-poker-card border border-gray-700 rounded px-2 py-2 text-white text-center"
            />
            <button
              onClick={() => onBid(bidAmount)}
              disabled={bidAmount <= auctionState.currentBid || bidAmount > myChips}
              className="px-6 py-2 bg-poker-green text-poker-bg font-bold rounded-md hover:opacity-90 disabled:opacity-50"
            >
              Raise
            </button>
          </div>
          <button
            onClick={onFold}
            className="px-6 py-2 bg-poker-red text-white font-bold rounded-md hover:opacity-90"
          >
            Fold
          </button>
        </div>
      ) : (
        <div className="text-center text-poker-muted">
          Waiting for {auctionState.activePlayers.find((p) => p.id === auctionState.whoseTurn)?.name ?? 'other player'}...
        </div>
      )}
    </div>
  )
}
