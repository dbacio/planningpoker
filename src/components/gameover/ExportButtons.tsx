'use client'

interface ExportButtonsProps {
  gameId: string
}

export function ExportButtons({ gameId }: ExportButtonsProps) {
  const handleDownload = async (format: 'json' | 'csv') => {
    const res = await fetch(`/api/export/${gameId}?format=${format}`)
    if (!res.ok) return

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sprint-poker-${gameId}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleDownload('json')}
        className="px-5 py-2 bg-poker-card border border-gray-600 rounded-md text-sm hover:border-poker-green"
      >
        Download JSON
      </button>
      <button
        onClick={() => handleDownload('csv')}
        className="px-5 py-2 bg-poker-card border border-gray-600 rounded-md text-sm hover:border-poker-green"
      >
        Download CSV
      </button>
    </div>
  )
}
