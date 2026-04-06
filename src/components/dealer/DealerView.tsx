'use client'
import { useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useGameState } from '@/hooks/useGameState'
import { TopBar } from '@/components/shared/TopBar'
import { Scoreboard } from '@/components/shared/Scoreboard'
import { Deck } from './Deck'
import { DealerTable } from './DealerTable'
import { PlayerRoster } from './PlayerRoster'
import { AuctionDealerControls } from './AuctionDealerControls'
import { GameOverScreen } from '@/components/gameover/GameOverScreen'

interface DealerViewProps {
  gameId: string
}

export function DealerView({ gameId }: DealerViewProps) {
  const socket = useSocket()
  const state = useGameState(socket)

  useEffect(() => {
    if (!socket) return
    const rejoin = () => {
      socket.emit('dealer:rejoin', { gameId })
    }
    if (socket.connected) {
      rejoin()
    } else {
      socket.once('connect', rejoin)
    }
    return () => {
      socket.off('connect', rejoin)
    }
  }, [socket, gameId])

  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}/play/${gameId}` : ''
  const isAuctionPhase = state.phase === 'AUCTION_PRESENT' || state.phase === 'AUCTION_BID' || state.phase === 'AUCTION_WON'

  const handleSelectStory = (storyId: string) => {
    socket?.emit('dealer:select-story', { storyId })
  }

  const handleAccept = (value: number) => {
    socket?.emit('dealer:accept', { value })
  }

  const handleShelve = () => {
    socket?.emit('dealer:shelve')
  }

  const handleReopen = () => {
    socket?.emit('dealer:reopen')
  }

  const handleStartAuction = () => {
    socket?.emit('dealer:start-auction')
  }

  const handlePresentAuctionItem = (storyId: string) => {
    socket?.emit('dealer:present-auction-item', { storyId })
  }

  const handleEndGame = () => {
    socket?.emit('dealer:end-game')
  }

  if (state.phase === 'GAME_OVER' && state.gameOver) {
    return <GameOverScreen gameOver={state.gameOver} gameId={gameId} isDealer />
  }

  const canDeal = state.phase === 'LOBBY' || state.phase === 'ACCEPT' || state.phase === 'DEALING'

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        remainingCapacity={state.remainingCapacity}
        sprintCapacity={state.sprintCapacity}
        deckCount={state.deckCount}
        estimatedCount={state.estimatedCount}
        gameId={gameId}
      />

      {/* Share link in lobby */}
      {state.phase === 'LOBBY' && (
        <div className="bg-poker-card text-center py-3 text-sm">
          Share this link: <span className="text-poker-green font-mono select-all">{shareLink}</span>
        </div>
      )}

      {/* Main 3-column layout */}
      <div className="flex-1 grid grid-cols-[220px_1fr_200px] min-h-0">
        <Deck
          stories={state.dealerDeck ?? []}
          onSelectStory={handleSelectStory}
          disabled={!canDeal}
        />

        {isAuctionPhase ? (
          <AuctionDealerControls
            deckStories={(state.dealerDeck ?? []).map((s) => ({ id: s.id, title: s.title }))}
            onPresentItem={handlePresentAuctionItem}
            onEndGame={handleEndGame}
            remainingCapacity={state.remainingCapacity}
          />
        ) : (
          <DealerTable
            state={state}
            onAccept={handleAccept}
            onShelve={handleShelve}
            onReopen={handleReopen}
            onEndGame={handleEndGame}
          />
        )}

        <PlayerRoster
          players={state.players}
          estimated={state.dealerEstimated ?? []}
        />
      </div>

      <Scoreboard scores={state.scores} />
    </div>
  )
}
