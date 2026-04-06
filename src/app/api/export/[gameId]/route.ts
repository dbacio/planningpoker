export const runtime = 'nodejs' // Required: share singleton engine with custom server

import { NextRequest, NextResponse } from 'next/server'
import engine from '@/engine/singleton'
import { generateJSONReport, generateCSVReport } from '@/engine/export'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const format = request.nextUrl.searchParams.get('format') ?? 'json'

  const game = engine.getGame(gameId)
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  if (format === 'csv') {
    const csv = generateCSVReport(game)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sprint-poker-${gameId}.csv"`,
      },
    })
  }

  const report = generateJSONReport(game)
  return NextResponse.json(report)
}
