# Sprint Poker

A real-time planning poker web app that turns sprint estimation into a competitive card game. A dealer (scrum master) controls the flow while players (contributors) compete to match accepted estimates and earn points.

Built with Next.js 16, React 19, Socket.IO, and Tailwind CSS 4.

## Quick Start

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Play

### 1. Create a Game (Dealer)

- Click **Create Game** on the landing page
- Set your sprint's total capacity (e.g., 40 story points)
- Upload a CSV file or paste CSV text with your stories (see [CSV format](#csv-format) below)
- Share the link displayed at the top of the dealer view with your team

### 2. Join a Game (Player)

- Open the share link from the dealer
- Enter your display name and click **Deal Me In**

### 3. Estimation Rounds

- The dealer selects a story from the deck
- Each player selects a Fibonacci card (1, 2, 3, 5, 8, 13, 21) or **All In** to request a discussion
- Once all players have voted, cards are revealed
- The dealer accepts a value — players who matched earn a point
- The next story loads automatically after 3 seconds

### 4. All In

- If any player goes **All In**, the round pauses for discussion
- Cards stay hidden to prevent anchoring bias
- The dealer can **Reopen Hand** (everyone re-votes) or **Shelve Story** (return it to the deck)

### 5. Auction Phase

- When the deck is empty but sprint capacity remains, the auction begins
- Each player receives 5 chips
- The dealer presents backlog items one at a time
- Players bid in rounds — the bid amount is the story point estimate
- Winning a bid costs chips and reduces sprint capacity
- Ties leave the story unassigned (recorded in the export for the dealer to resolve)

### 6. Game Over

- The game ends when capacity reaches zero, the deck and auction are complete, or the dealer ends it manually
- Final scores are displayed with a winner announcement
- The dealer can download a JSON or CSV game report

## CSV Format

```csv
title,description,storyPoints,tags,priority
"User authentication","Implement login/logout flow with JWT tokens",5,"backend;auth;security","P1"
"Profile settings","Allow users to update their profile",,"frontend;ux","P2"
```

| Column | Required | Description |
|--------|----------|-------------|
| title | Yes | Story name |
| description | Yes | Story description |
| storyPoints | No | Pre-existing estimate (blank for unestimated). Used to compute the River |
| tags | No | Semicolon-separated labels. Used for River similarity matching |
| priority | No | Freeform (P1, P2, High, Low, etc.) |

Sample CSVs are included in `test/fixtures/` for quick testing.

## Game Mechanics

### The River

Below each story, the River displays suggested estimates drawn from similar stories in your CSV. Similarity is scored by tag overlap with priority as a tiebreaker. If no similar stories exist, the dealer can set River values manually.

### Scoring

Binary scoring: match the dealer's accepted value = 1 point. No partial credit.

### Sprint Capacity

The total budget is set at game creation and decreases with each accepted estimate and auction win. Warnings appear when capacity is low, and values that would exceed capacity require dealer confirmation.

### Roles

**Dealer** sees the full story metadata (tags, priority) plus the deck, and controls the game pace. **Players** see only the story title and description, keeping them focused on estimating the work.

## App Architecture

### Tech Stack

- **Next.js 16** with React 19 and TypeScript
- **Socket.IO** for real-time WebSocket communication
- **Tailwind CSS 4** with a custom dark poker table theme
- **Vitest** with 64 unit tests across 7 test files

### Structure

```
src/
  types/          Game, event, and state machine type definitions
  engine/         Server-side game logic (pure, testable)
    state-machine State machine with enforced transitions (10 phases)
    game-engine   Core game logic: deals, bets, scoring, auctions
    game-store    In-memory game session storage
    csv-parser    CSV to Story[] parser
    river         Similar-story suggestion algorithm
    export        JSON and CSV report generation
  socket/         Socket.IO event handlers wiring clients to the engine
  hooks/          React hooks for socket connection and game state
  components/
    shared/       TopBar, StoryCard, River, PlayerCards, Scoreboard, Confetti
    dealer/       3-column dealer dashboard (Deck, Table, PlayerRoster)
    player/       Focused player view (JoinForm, PlayerHand, AuctionBidControls)
    gameover/     Final scoreboard and export buttons
  app/            Next.js routes (/, /dealer/[gameId], /play/[gameId])
server.ts         Custom Node.js server (Next.js + Socket.IO on one port)
```

### State Machine

The game flow is a strict state machine with 10 phases. Invalid transitions are rejected server-side.

```
LOBBY → DEALING → BETTING → REVEAL → ACCEPT → (next story or auction or game over)
                    ↓
              ALL_IN_PAUSE → BETTING (reopen) or DEALING (shelve)

ACCEPT → AUCTION_PRESENT → AUCTION_BID → AUCTION_WON → (next auction or game over)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |

## License

MIT
