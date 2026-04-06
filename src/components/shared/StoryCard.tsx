'use client'
import type { Story } from '@/types/game'

interface StoryCardProps {
  story: { title: string; description: string } | null
  fullStory?: Story | null  // dealer gets full metadata
  label?: string
}

export function StoryCard({ story, fullStory, label = 'Current Story' }: StoryCardProps) {
  if (!story) return null

  return (
    <div className="bg-poker-card border border-gray-700 rounded-xl p-5 w-full max-w-lg">
      <div className="text-xs uppercase text-poker-red tracking-widest mb-1">{label}</div>
      <div className="text-xl font-bold mb-2">{story.title}</div>
      <div className="text-sm text-gray-400 leading-relaxed">{story.description}</div>
      {fullStory && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {fullStory.tags.map((tag) => (
            <span key={tag} className="bg-poker-bg px-2 py-1 rounded text-xs text-poker-green">{tag}</span>
          ))}
          {fullStory.priority && (
            <span className="bg-poker-bg px-2 py-1 rounded text-xs text-poker-red">{fullStory.priority}</span>
          )}
        </div>
      )}
    </div>
  )
}
