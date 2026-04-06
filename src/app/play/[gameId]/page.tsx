import { PlayerView } from '@/components/player/PlayerView'

interface PlayerPageProps {
  params: Promise<{ gameId: string }>
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { gameId } = await params
  return <PlayerView gameId={gameId} />
}
