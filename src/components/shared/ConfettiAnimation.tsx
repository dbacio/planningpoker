'use client'
import { useEffect } from 'react'

export function ConfettiAnimation() {
  useEffect(() => {
    import('canvas-confetti').then((confetti) => {
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti.default({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#4ecca3', '#e94560', '#ffffff'],
        })
        confetti.default({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#4ecca3', '#e94560', '#ffffff'],
        })

        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    })
  }, [])

  return null
}
