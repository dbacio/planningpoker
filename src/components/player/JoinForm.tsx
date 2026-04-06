'use client'
import { useState } from 'react'

interface JoinFormProps {
  onJoin: (name: string) => void
  error: string | null
}

export function JoinForm({ onJoin, error }: JoinFormProps) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) onJoin(name.trim())
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-poker-surface rounded-xl p-8 space-y-4 max-w-sm w-full">
        <h2 className="text-2xl font-bold text-poker-red text-center">Sprint Poker</h2>
        <p className="text-poker-muted text-center text-sm">Enter your name to join the table</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoFocus
          className="w-full bg-poker-card border border-gray-700 rounded px-3 py-3 text-white text-center text-lg"
          maxLength={20}
        />
        {error && <p className="text-poker-red text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full bg-poker-green text-poker-bg font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          Take a Seat
        </button>
      </form>
    </div>
  )
}
