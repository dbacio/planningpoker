import { createServer } from 'http'
import next from 'next'
import { Server } from 'socket.io'
import engine from './src/engine/singleton'
import { registerHandlers } from './src/socket/handlers'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res)
  })

  const io = new Server(httpServer, {
    cors: { origin: '*' },
    transports: ['websocket', 'polling'],
  })

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)
    registerHandlers(io, socket, engine)
  })

  httpServer.listen(port, () => {
    console.log(`> Sprint Poker running on http://${hostname}:${port}`)
  })
})
