import { DealerView } from '@/components/dealer/DealerView'

interface DealerPageProps {
  params: Promise<{ gameId: string }>
}

export default async function DealerPage({ params }: DealerPageProps) {
  const { gameId } = await params
  return <DealerView gameId={gameId} />
}
