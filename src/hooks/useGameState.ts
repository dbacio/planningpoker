'use client'
import { useState, useEffect } from 'react'
import type { Socket } from 'socket.io-client'
import type { GameStatePayload, PlayerStatus, AuctionBidState, GameOverPayload, ServerEvents, ClientEvents } from '@/types/events'
import type { GamePhase, Story } from '@/types/game'

type TypedSocket = Socket<ServerEvents, ClientEvents>

export interface GameState {
  gameId: string | null
  phase: GamePhase | null
  sprintCapacity: number
  remainingCapacity: number
  deckCount: number
  estimatedCount: number
  currentStory: { title: string; description: string } | null
  currentStoryFull: Story | null
  river: number[]
  players: PlayerStatus[]
  myPlayerId: string | null
  myBet: number | 'all_in' | null
  auctionChips: number | null
  scores: { id: string; name: string; score: number }[]
  revealedBets: { playerId: string; playerName: string; value: number | 'all_in' }[] | null
  auctionState: AuctionBidState | null
  gameOver: GameOverPayload | null
  error: string | null
  dealerDeck: Story[] | null
  dealerEstimated: { title: string; acceptedValue: number }[] | null
  lastAcceptedValue: number | null
  lastRoundMatched: boolean | null
  lastRoundMyBet: number | 'all_in' | null
}

const initialState: GameState = {
  gameId: null,
  phase: null,
  sprintCapacity: 0,
  remainingCapacity: 0,
  deckCount: 0,
  estimatedCount: 0,
  currentStory: null,
  currentStoryFull: null,
  river: [],
  players: [],
  myPlayerId: null,
  myBet: null,
  auctionChips: null,
  scores: [],
  revealedBets: null,
  dealerDeck: null,
  dealerEstimated: null,
  auctionState: null,
  gameOver: null,
  error: null,
  lastAcceptedValue: null,
  lastRoundMatched: null,
  lastRoundMyBet: null,
}

export function useGameState(socket: TypedSocket | null): GameState {
  const [state, setState] = useState<GameState>(initialState)

  useEffect(() => {
    if (!socket) return

    socket.on('game:state', (data: GameStatePayload) => {
      setState((prev) => ({
        ...prev,
        gameId: data.gameId,
        phase: data.phase,
        sprintCapacity: data.sprintCapacity,
        remainingCapacity: data.remainingCapacity,
        deckCount: data.deckCount,
        estimatedCount: data.estimatedCount,
        currentStory: data.currentStory,
        currentStoryFull: data.currentStoryFull,
        river: data.river,
        players: data.players,
        myPlayerId: data.myPlayerId,
        myBet: data.myBet,
        auctionChips: data.auctionChips,
        scores: data.scores,
        dealerDeck: data.dealerDeck ?? prev.dealerDeck,
        dealerEstimated: data.dealerEstimated ?? prev.dealerEstimated,
        lastAcceptedValue: data.lastAcceptedValue !== undefined ? (data.lastAcceptedValue ?? null) : prev.lastAcceptedValue,
        lastRoundMatched: data.lastRoundMatched !== undefined ? (data.lastRoundMatched ?? null) : prev.lastRoundMatched,
        lastRoundMyBet: data.lastRoundMyBet !== undefined ? (data.lastRoundMyBet ?? null) : prev.lastRoundMyBet,
        error: null,
      }))
    })

    socket.on('game:phase', (data) => {
      setState((prev) => ({
        ...prev,
        phase: data.phase,
        currentStory: data.story ? { title: data.story.title, description: data.story.description } : prev.currentStory,
        river: data.river ?? prev.river,
        // Only clear revealedBets when starting a new round (BETTING),
        // NOT during REVEAL/ACCEPT when we need them for the accept buttons
        revealedBets: data.phase === 'BETTING' || data.phase === 'DEALING' ? null : prev.revealedBets,
      }))
    })

    socket.on('game:player-status', (data) => {
      setState((prev) => ({ ...prev, players: data.players }))
    })

    socket.on('round:reveal', (data) => {
      setState((prev) => ({ ...prev, revealedBets: data.bets }))
    })

    socket.on('auction:bid', (data) => {
      setState((prev) => ({ ...prev, auctionState: data }))
    })

    socket.on('game:over', (data) => {
      setState((prev) => ({ ...prev, gameOver: data, phase: 'GAME_OVER' }))
    })

    socket.on('game:scores', (data) => {
      setState((prev) => ({ ...prev, scores: data.players }))
    })

    socket.on('game:error', (data) => {
      setState((prev) => ({ ...prev, error: data.message }))
    })

    return () => {
      socket.off('game:state')
      socket.off('game:phase')
      socket.off('game:player-status')
      socket.off('round:reveal')
      socket.off('auction:bid')
      socket.off('game:over')
      socket.off('game:scores')
      socket.off('game:error')
    }
  }, [socket])

  return state
}
