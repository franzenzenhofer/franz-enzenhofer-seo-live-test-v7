import { getResultColor } from '@/shared/colors'

const ORDER = ['error', 'warn', 'info', 'ok'] as const

export const ResultBadges = ({ counts }: { counts: Record<string, number> }) => (
  <div className="flex flex-wrap items-center gap-2 text-xs">
    {ORDER.map((type) => {
      const count = counts[type]
      if (!count) return null
      const color = getResultColor(type)
      return (
        <span key={type} className={`px-2 py-1 rounded ${color.badge}`}>
          {type}: {count}
        </span>
      )
    })}
  </div>
)
