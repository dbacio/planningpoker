'use client'
import { useState, useEffect, useRef } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useGameState } from '@/hooks/useGameState'
import { TopBar } from '@/components/shared/TopBar'
import { StoryCard } from '@/components/shared/StoryCard'
import { River } from '@/components/shared/River'
import { PlayerCards } from '@/components/shared/PlayerCards'
import { Scoreboard } from '@/components/shared/Scoreboard'
import { PlayerHand } from './PlayerHand'
import { JoinForm } from './JoinForm'
import { AuctionBidControls } from './AuctionBidControls'
import { GameOverScreen } from '@/components/gameover/GameOverScreen'

interface PlayerViewProps {
  gameId: string
}

export function PlayerView({ gameId }: PlayerViewProps) {
  const socket = useSocket()
  const state = useGameState(socket)
  const [joined, setJoined] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [resultBanner, setResultBanner] = useState<{ acceptedValue: number; matched: boolean; myBet: number | 'all_in' | null } | null>(null)
  const prevLastAcceptedRef = useRef<number | null>(null)

  // Show result banner when server sends accepted value + match result
  useEffect(() => {
    if (
      state.lastAcceptedValue !== null &&
      state.lastAcceptedValue !== undefined &&
      state.lastAcceptedValue !== prevLastAcceptedRef.current
    ) {
      prevLastAcceptedRef.current = state.lastAcceptedValue
      // Use server-provided match result (computed before bets were cleared)
      const matched = state.lastRoundMatched === true
      setResultBanner({ acceptedValue: state.lastAcceptedValue, matched, myBet: state.lastRoundMyBet ?? null })
      const timer = setTimeout(() => setResultBanner(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [state.lastAcceptedValue, state.lastRoundMatched, state.lastRoundMyBet])

  const handleJoin = (name: string) => {
    if (!socket) return
    socket.emit('player:join', { name, gameId })
    socket.once('game:state', () => {
      setJoined(true)
      setPlayerName(name)
    })
  }

  const handleBet = (value: number | 'all_in') => {
    socket?.emit('player:bet', { value })
  }

  const handleAuctionBid = (amount: number) => {
    socket?.emit('player:auction-bid', { amount })
  }

  const handleFold = () => {
    socket?.emit('player:auction-bid', { fold: true })
  }

  if (!joined) {
    return <JoinForm onJoin={handleJoin} error={state.error} />
  }

  if (state.phase === 'GAME_OVER' && state.gameOver) {
    return <GameOverScreen gameOver={state.gameOver} gameId={gameId} />
  }

  const isAuctionPhase = state.phase === 'AUCTION_BID'
  const isBetting = state.phase === 'BETTING'
  const isWaiting = state.phase === 'LOBBY' || state.phase === 'DEALING'

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        remainingCapacity={state.remainingCapacity}
        sprintCapacity={state.sprintCapacity}
        deckCount={state.deckCount}
        estimatedCount={state.estimatedCount}
        gameId={gameId}
        playerName={playerName}
      />

      <div className="flex-1 flex flex-col items-center gap-5 p-6 overflow-y-auto">
        {resultBanner && (
          <div className={`w-full max-w-md text-center p-5 rounded-xl border-2 ${
            resultBanner.matched
              ? 'bg-green-900/30 border-poker-green'
              : 'bg-red-900/30 border-poker-red'
          }`}>
            <div className="text-sm text-poker-muted mb-1">Accepted Value</div>
            <div className="text-4xl font-bold mb-2">{resultBanner.acceptedValue}</div>
            <div className={`text-lg font-bold ${resultBanner.matched ? 'text-poker-green' : 'text-poker-red'}`}>
              {resultBanner.matched ? 'You nailed it!' : 'Whoops!'}
            </div>
            <div className="text-poker-muted text-sm mt-1">
              {resultBanner.matched
                ? `Your estimate of ${resultBanner.myBet} matched!`
                : `You estimated ${resultBanner.myBet === 'all_in' ? 'All In' : resultBanner.myBet}.`}
            </div>
          </div>
        )}

        {isWaiting && (
          <div className="text-poker-muted text-lg mt-20">Waiting for the dealer...</div>
        )}

        {state.currentStory && (
          <>
            <StoryCard story={state.currentStory} />
            <River values={state.river} />
          </>
        )}

        <PlayerCards
          players={state.players}
          revealedBets={state.revealedBets}
          myPlayerId={state.myPlayerId}
          myBet={state.myBet}
        />

        {isBetting && (
          <PlayerHand
            onBet={handleBet}
            currentBet={state.myBet}
            disabled={false}
          />
        )}

        {state.phase === 'ALL_IN_PAUSE' && (
          <div className="text-center p-5 bg-poker-surface rounded-xl">
            <div className="text-poker-red text-lg font-bold">All In Called</div>
            <div className="text-poker-muted mt-1">Discussion in progress. Waiting for dealer...</div>
          </div>
        )}

        {state.phase === 'ACCEPT' && (
          <div className="text-poker-muted text-sm">Dealer is selecting the accepted value...</div>
        )}

        {isAuctionPhase && state.auctionState && (
          <AuctionBidControls
            auctionState={state.auctionState}
            myChips={state.auctionChips ?? 0}
            myPlayerId={state.myPlayerId ?? ''}
            onBid={handleAuctionBid}
            onFold={handleFold}
          />
        )}
      </div>

      <Scoreboard scores={state.scores} currentPlayerId={state.myPlayerId ?? undefined} />
    </div>
  )
}
