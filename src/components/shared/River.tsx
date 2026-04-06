'use client'

interface RiverProps {
  values: number[]
}

export function River({ values }: RiverProps) {
  if (values.length === 0) return null

  return (
    <div className="text-center">
      <div className="text-xs uppercase text-poker-muted tracking-widest mb-2">The River — Similar Estimates</div>
      <div className="flex gap-3 justify-center">
        {values.map((value, i) => (
          <div
            key={i}
            className="w-12 h-16 bg-poker-card border border-poker-green rounded-md flex items-center justify-center text-lg font-bold text-poker-green"
          >
            {value}
          </div>
        ))}
      </div>
    </div>
  )
}
