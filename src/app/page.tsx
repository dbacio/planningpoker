'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'

export default function Home() {
  const router = useRouter()
  const socket = useSocket()
  const [joinCode, setJoinCode] = useState('')
  const [capacity, setCapacity] = useState(40)
  const [csvText, setCsvText] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreateGame = async () => {
    if (!socket) return
    setError('')

    setCreating(true)
    // Send raw CSV text to server — parsing happens server-side
    // (csv-parse and crypto.randomBytes are Node.js-only modules)
    socket.emit('dealer:create-game', { sprintCapacity: capacity, csvText: csvText.trim() })
    socket.once('game:state', (data) => {
      router.push(`/dealer/${data.gameId}`)
    })
    socket.once('game:error', (data) => {
      setError(data.message)
      setCreating(false)
    })
  }

  const handleJoin = () => {
    if (joinCode.trim()) {
      router.push(`/play/${joinCode.trim()}`)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCsvText(ev.target?.result as string)
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-poker-red mb-2">Sprint Poker</h1>
          <p className="text-poker-muted">Real-time planning poker for agile teams</p>
        </div>

        {/* Create Game */}
        <div className="bg-poker-surface rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold">Create Game</h2>
          <div>
            <label className="text-xs uppercase text-poker-muted tracking-wide">Sprint Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full mt-1 bg-poker-card border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-xs uppercase text-poker-muted tracking-wide">Stories (CSV)</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full mt-1 text-sm text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-poker-card file:text-white hover:file:opacity-80 cursor-pointer"
            />
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Or paste CSV here..."
              rows={4}
              className="w-full mt-2 bg-poker-card border border-gray-700 rounded px-3 py-2 text-white text-sm font-mono"
            />
          </div>
          {error && <p className="text-poker-red text-sm">{error}</p>}
          <button
            onClick={handleCreateGame}
            disabled={creating}
            className="w-full bg-poker-green text-poker-bg font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Game'}
          </button>
        </div>

        {/* Join Game */}
        <div className="bg-poker-surface rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold">Join Game</h2>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter room code"
            className="w-full bg-poker-card border border-gray-700 rounded px-3 py-2 text-white"
          />
          <button
            onClick={handleJoin}
            disabled={!joinCode.trim()}
            className="w-full bg-poker-red text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            Deal Me In
          </button>
        </div>
      </div>
    </div>
  )
}
