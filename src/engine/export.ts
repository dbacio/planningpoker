import type { Game, GameReport } from '@/types/game'

export function generateJSONReport(game: Game): GameReport {
  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score)

  return {
    gameId: game.id,
    date: new Date().toISOString(),
    sprintCapacity: game.sprintCapacity,
    capacityUsed: game.sprintCapacity - game.remainingCapacity,
    players: sortedPlayers.map((p) => ({ name: p.name, finalScore: p.score })),
    winner: sortedPlayers[0]?.name ?? 'N/A',
    estimationRounds: game.rounds
      .filter((r) => r.phase === 'estimation')
      .map((r) => ({
        storyTitle: r.storyTitle,
        storyDescription: r.storyDescription,
        river: r.river,
        bets: r.bets.map((b) => ({ player: b.playerName, value: b.value })),
        acceptedValue: r.acceptedValue,
        wasReopened: r.wasReopened,
        shelved: r.shelved,
      })),
    auctionRounds: game.rounds
      .filter((r) => r.phase === 'auction')
      .map((r) => ({
        storyTitle: r.storyTitle,
        bids: r.bets.map((b) => ({
          player: b.playerName,
          amount: typeof b.value === 'number' ? b.value : 0,
          folded: false,
        })),
        winner: r.auctionWinner,
        tied: r.tied,
        tiedPlayers: r.tiedPlayers,
        finalBid: r.acceptedValue,
      })),
    unestimatedStories: game.deck.map((s) => s.title),
  }
}

export function generateCSVReport(game: Game): string {
  const playerNames = game.players.map((p) => p.name)
  const header = ['round', 'phase', 'story_title', 'accepted_value', ...playerNames, 'winner', 'tied', 'notes']

  const rows = game.rounds.map((round, idx) => {
    const playerBets = game.players.map((player) => {
      const bet = round.bets.find((b) => b.playerId === player.id)
      return bet ? String(bet.value) : ''
    })

    const notes: string[] = []
    if (round.shelved) notes.push('shelved')
    if (round.wasReopened) notes.push('reopened')
    if (round.wasAllIn) notes.push('all_in triggered')
    if (round.tied) notes.push('tied')

    return [
      String(idx + 1),
      round.phase,
      `"${round.storyTitle}"`,
      round.acceptedValue !== null ? String(round.acceptedValue) : '',
      ...playerBets,
      round.auctionWinner ?? '',
      round.tied ? 'yes' : '',
      notes.join('; '),
    ]
  })

  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
}
