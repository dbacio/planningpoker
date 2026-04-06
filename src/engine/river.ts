import type { Story } from '@/types/game'

const MAX_RIVER_SIZE = 5

export function calculateRiver(current: Story, estimatedStories: Story[]): number[] {
  const withPoints = estimatedStories.filter((s) => s.storyPoints !== null)

  if (withPoints.length === 0) return []

  const scored = withPoints
    .map((story) => {
      const tagOverlap = current.tags.filter((t) => story.tags.includes(t)).length
      const priorityMatch = story.priority === current.priority ? 1 : 0
      return { storyPoints: story.storyPoints!, score: tagOverlap, priorityMatch }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.priorityMatch - a.priorityMatch
    })

  return scored.slice(0, MAX_RIVER_SIZE).map((s) => s.storyPoints)
}
