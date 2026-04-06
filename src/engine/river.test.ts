import { describe, it, expect } from 'vitest'
import { calculateRiver } from './river'
import type { Story } from '@/types/game'

function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 'test',
    title: 'Test',
    description: 'Test story',
    storyPoints: null,
    tags: [],
    priority: 'P2',
    assignee: null,
    acceptedValue: null,
    ...overrides,
  }
}

describe('calculateRiver', () => {
  it('returns empty array when no estimated stories exist', () => {
    const current = makeStory({ tags: ['frontend'] })
    const result = calculateRiver(current, [])
    expect(result).toEqual([])
  })

  it('returns story points of similar stories sorted by tag overlap', () => {
    const current = makeStory({ tags: ['frontend', 'ux'], priority: 'P2' })
    const estimated = [
      makeStory({ id: 'a', tags: ['frontend', 'ux'], storyPoints: 5 }),
      makeStory({ id: 'b', tags: ['frontend'], storyPoints: 3 }),
      makeStory({ id: 'c', tags: ['backend'], storyPoints: 8 }),
    ]
    const result = calculateRiver(current, estimated)
    expect(result).toEqual([5, 3])
  })

  it('uses priority as tiebreaker when tag overlap is equal', () => {
    const current = makeStory({ tags: ['frontend'], priority: 'P1' })
    const estimated = [
      makeStory({ id: 'a', tags: ['frontend'], priority: 'P1', storyPoints: 3 }),
      makeStory({ id: 'b', tags: ['frontend'], priority: 'P2', storyPoints: 8 }),
    ]
    const result = calculateRiver(current, estimated)
    expect(result[0]).toBe(3) // P1 match comes first
  })

  it('excludes stories with no storyPoints', () => {
    const current = makeStory({ tags: ['frontend'] })
    const estimated = [
      makeStory({ id: 'a', tags: ['frontend'], storyPoints: null }),
      makeStory({ id: 'b', tags: ['frontend'], storyPoints: 5 }),
    ]
    const result = calculateRiver(current, estimated)
    expect(result).toEqual([5])
  })

  it('returns at most 5 values', () => {
    const current = makeStory({ tags: ['frontend'] })
    const estimated = Array.from({ length: 10 }, (_, i) =>
      makeStory({ id: `s${i}`, tags: ['frontend'], storyPoints: i + 1 })
    )
    const result = calculateRiver(current, estimated)
    expect(result.length).toBeLessThanOrEqual(5)
  })

  it('excludes stories with zero tag overlap', () => {
    const current = makeStory({ tags: ['frontend'] })
    const estimated = [
      makeStory({ id: 'a', tags: ['backend', 'infra'], storyPoints: 8 }),
    ]
    const result = calculateRiver(current, estimated)
    expect(result).toEqual([])
  })
})
