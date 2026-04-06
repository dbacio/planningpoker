import { parse } from 'csv-parse/sync'
import { randomBytes } from 'crypto'
import type { Story } from '@/types/game'

export async function parseStoriesCSV(csvString: string): Promise<Story[]> {
  const trimmed = csvString.trim()
  if (!trimmed) {
    throw new Error('CSV is empty')
  }

  const records = parse(trimmed, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[]

  if (records.length === 0) {
    throw new Error('CSV contains no data rows')
  }

  return records.map((row) => ({
    id: randomBytes(4).toString('hex'),
    title: row.title || '',
    description: row.description || '',
    storyPoints: row.storyPoints ? Number(row.storyPoints) : null,
    tags: row.tags ? row.tags.split(';').map((t: string) => t.trim()).filter(Boolean) : [],
    priority: row.priority || '',
    assignee: null,
    acceptedValue: null,
  }))
}
