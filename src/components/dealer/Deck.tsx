'use client'
import type { Story } from '@/types/game'

interface DeckProps {
  stories: Story[]
  onSelectStory: (storyId: string) => void
  disabled: boolean
}

export function Deck({ stories, onSelectStory, disabled }: DeckProps) {
  return (
    <div className="bg-poker-surface p-4 border-r border-poker-card overflow-y-auto">
      <div className="text-xs uppercase text-poker-muted tracking-widest mb-3">The Deck</div>
      <div className="flex flex-col gap-2">
        {stories.map((story) => (
          <button
            key={story.id}
            onClick={() => onSelectStory(story.id)}
            disabled={disabled}
            className="text-left p-3 bg-poker-card border-l-3 border-gray-600 rounded-md hover:border-poker-green disabled:opacity-50 disabled:hover:border-gray-600 transition-colors"
          >
            <div className="text-sm font-semibold">{story.title}</div>
            <div className="text-xs text-poker-muted mt-1">
              {story.tags.join(', ')}
            </div>
          </button>
        ))}
        {stories.length === 0 && (
          <div className="text-sm text-poker-muted text-center py-4">Deck is empty</div>
        )}
      </div>
    </div>
  )
}
