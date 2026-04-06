import { describe, it, expect } from 'vitest'
import { parseStoriesCSV } from './csv-parser'
import { readFileSync } from 'fs'
import path from 'path'

describe('parseStoriesCSV', () => {
  it('parses a valid CSV string into Story objects', async () => {
    const csv = readFileSync(
      path.join(__dirname, '../../test/fixtures/sample-stories.csv'),
      'utf-8'
    )
    const stories = await parseStoriesCSV(csv)
    expect(stories).toHaveLength(5)
  })

  it('parses title and description', async () => {
    const csv = `title,description,storyPoints,tags,priority\n"Login page","Build the login page",,"frontend","P1"`
    const stories = await parseStoriesCSV(csv)
    expect(stories[0].title).toBe('Login page')
    expect(stories[0].description).toBe('Build the login page')
  })

  it('parses storyPoints as number or null', async () => {
    const csv = `title,description,storyPoints,tags,priority\n"A","desc",5,"tag","P1"\n"B","desc",,"tag","P2"`
    const stories = await parseStoriesCSV(csv)
    expect(stories[0].storyPoints).toBe(5)
    expect(stories[1].storyPoints).toBeNull()
  })

  it('parses semicolon-delimited tags into array', async () => {
    const csv = `title,description,storyPoints,tags,priority\n"A","desc",,"frontend;backend;api","P1"`
    const stories = await parseStoriesCSV(csv)
    expect(stories[0].tags).toEqual(['frontend', 'backend', 'api'])
  })

  it('handles empty tags gracefully', async () => {
    const csv = `title,description,storyPoints,tags,priority\n"A","desc",,,"P1"`
    const stories = await parseStoriesCSV(csv)
    expect(stories[0].tags).toEqual([])
  })

  it('assigns unique IDs to each story', async () => {
    const csv = `title,description,storyPoints,tags,priority\n"A","d1",,,"P1"\n"B","d2",,,"P2"`
    const stories = await parseStoriesCSV(csv)
    expect(stories[0].id).toBeTruthy()
    expect(stories[0].id).not.toBe(stories[1].id)
  })

  it('initializes assignee and acceptedValue as null', async () => {
    const csv = `title,description,storyPoints,tags,priority\n"A","desc",,,"P1"`
    const stories = await parseStoriesCSV(csv)
    expect(stories[0].assignee).toBeNull()
    expect(stories[0].acceptedValue).toBeNull()
  })

  it('throws on empty CSV', async () => {
    await expect(parseStoriesCSV('')).rejects.toThrow()
  })

  it('throws on CSV with only headers', async () => {
    await expect(parseStoriesCSV('title,description,storyPoints,tags,priority\n')).rejects.toThrow()
  })
})
