'use client'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ClientEvents, ServerEvents } from '@/types/events'

type TypedSocket = Socket<ServerEvents, ClientEvents>

export function useSocket(): TypedSocket | null {
  const [socket, setSocket] = useState<TypedSocket | null>(null)

  useEffect(() => {
    const s: TypedSocket = io({
      transports: ['websocket', 'polling'],
    })

    s.on('connect', () => {
      setSocket(s)
    })

    // If already connected (e.g. instant connect), set immediately
    if (s.connected) {
      setSocket(s)
    }

    return () => {
      s.disconnect()
    }
  }, [])

  return socket
}
