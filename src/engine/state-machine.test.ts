import { describe, it, expect } from 'vitest'
import { createStateMachine, InvalidTransitionError } from './state-machine'

describe('StateMachine', () => {
  it('starts in LOBBY phase', () => {
    const sm = createStateMachine()
    expect(sm.currentState).toBe('LOBBY')
  })

  it('transitions LOBBY → DEALING on dealer:select-story', () => {
    const sm = createStateMachine()
    const next = sm.transition('dealer:select-story')
    expect(next).toBe('DEALING')
    expect(sm.currentState).toBe('DEALING')
  })

  it('transitions DEALING → BETTING on story-displayed', () => {
    const sm = createStateMachine('DEALING')
    const next = sm.transition('story-displayed')
    expect(next).toBe('BETTING')
  })

  it('transitions BETTING → REVEAL on all-players-submitted', () => {
    const sm = createStateMachine('BETTING')
    const next = sm.transition('all-players-submitted')
    expect(next).toBe('REVEAL')
  })

  it('transitions BETTING → ALL_IN_PAUSE on all-in-detected', () => {
    const sm = createStateMachine('BETTING')
    const next = sm.transition('all-in-detected')
    expect(next).toBe('ALL_IN_PAUSE')
  })

  it('transitions ALL_IN_PAUSE → BETTING on dealer:reopen', () => {
    const sm = createStateMachine('ALL_IN_PAUSE')
    const next = sm.transition('dealer:reopen')
    expect(next).toBe('BETTING')
  })

  it('transitions ALL_IN_PAUSE → DEALING on dealer:shelve', () => {
    const sm = createStateMachine('ALL_IN_PAUSE')
    const next = sm.transition('dealer:shelve')
    expect(next).toBe('DEALING')
  })

  it('transitions REVEAL → ACCEPT on cards-shown', () => {
    const sm = createStateMachine('REVEAL')
    const next = sm.transition('cards-shown')
    expect(next).toBe('ACCEPT')
  })

  it('transitions ACCEPT → DEALING on dealer:select-story', () => {
    const sm = createStateMachine('ACCEPT')
    const next = sm.transition('dealer:select-story')
    expect(next).toBe('DEALING')
  })

  it('transitions ACCEPT → AUCTION_PRESENT on dealer:start-auction', () => {
    const sm = createStateMachine('ACCEPT')
    const next = sm.transition('dealer:start-auction')
    expect(next).toBe('AUCTION_PRESENT')
  })

  it('transitions ACCEPT → GAME_OVER on dealer:end-game', () => {
    const sm = createStateMachine('ACCEPT')
    const next = sm.transition('dealer:end-game')
    expect(next).toBe('GAME_OVER')
  })

  it('transitions AUCTION_PRESENT → AUCTION_BID on story-displayed', () => {
    const sm = createStateMachine('AUCTION_PRESENT')
    const next = sm.transition('story-displayed')
    expect(next).toBe('AUCTION_BID')
  })

  it('transitions AUCTION_BID → AUCTION_WON on auction-resolved', () => {
    const sm = createStateMachine('AUCTION_BID')
    const next = sm.transition('auction-resolved')
    expect(next).toBe('AUCTION_WON')
  })

  it('transitions AUCTION_WON → AUCTION_PRESENT on dealer:start-auction', () => {
    const sm = createStateMachine('AUCTION_WON')
    const next = sm.transition('dealer:start-auction')
    expect(next).toBe('AUCTION_PRESENT')
  })

  it('transitions AUCTION_WON → GAME_OVER on dealer:end-game', () => {
    const sm = createStateMachine('AUCTION_WON')
    const next = sm.transition('dealer:end-game')
    expect(next).toBe('GAME_OVER')
  })

  it('allows dealer:end-game from any non-GAME_OVER state', () => {
    const phases = ['LOBBY', 'DEALING', 'BETTING', 'REVEAL', 'ALL_IN_PAUSE', 'ACCEPT', 'AUCTION_PRESENT', 'AUCTION_BID', 'AUCTION_WON'] as const
    for (const phase of phases) {
      const sm = createStateMachine(phase)
      expect(sm.transition('dealer:end-game')).toBe('GAME_OVER')
    }
  })

  it('throws InvalidTransitionError for invalid transitions', () => {
    const sm = createStateMachine('LOBBY')
    expect(() => sm.transition('dealer:accept')).toThrow(InvalidTransitionError)
  })

  it('throws for any transition from GAME_OVER', () => {
    const sm = createStateMachine('GAME_OVER')
    expect(() => sm.transition('dealer:select-story')).toThrow(InvalidTransitionError)
  })

  it('returns valid events for current state', () => {
    const sm = createStateMachine('BETTING')
    const validEvents = sm.getValidEvents()
    expect(validEvents).toContain('all-players-submitted')
    expect(validEvents).toContain('all-in-detected')
    expect(validEvents).toContain('dealer:end-game')
    expect(validEvents).not.toContain('dealer:accept')
  })
})
