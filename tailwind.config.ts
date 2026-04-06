import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        poker: {
          bg: '#1a1a2e',
          surface: '#16213e',
          card: '#0f3460',
          green: '#4ecca3',
          red: '#e94560',
          'red-dark': '#c73650',
          muted: '#888888',
        },
      },
    },
  },
  plugins: [],
}

export default config
