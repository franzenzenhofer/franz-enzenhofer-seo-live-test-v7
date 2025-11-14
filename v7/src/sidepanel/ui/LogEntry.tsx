/**
 * Log Entry - Individual log line
 */

const COLOR_MAP: Record<string, string> = {
  error: 'text-red-600',
  warn: 'text-orange-600',
  rule: 'text-blue-600',
  rules: 'text-blue-700',
  dom: 'text-green-600',
  storage: 'text-purple-600',
  event: 'text-cyan-600',
  ui: 'text-pink-600',
  perf: 'text-yellow-700',
  chrome: 'text-gray-600',
  offscreen: 'text-indigo-600',
  page: 'text-teal-600',
  nav: 'text-lime-600',
  req: 'text-sky-600',
  msg: 'text-violet-600',
  content: 'text-emerald-600',
  alarm: 'text-amber-600',
  auth: 'text-rose-600',
}

function extractCategory(log: string): string {
  const match = log.match(/\]\s+([a-z]+):/i)
  return match?.[1] || 'unknown'
}

function getCategoryColor(category: string): string {
  return COLOR_MAP[category] || 'text-gray-500'
}

export function LogEntry({
  log,
  index,
  isSelected,
  isCopied,
  onToggleSelect,
  onCopy,
}: {
  log: string
  index: number
  isSelected: boolean
  isCopied: boolean
  onToggleSelect: () => void
  onCopy: () => void
}) {
  const category = extractCategory(log)

  return (
    <div
      className={`group flex items-start gap-1 text-[10px] font-mono px-1 py-0.5 rounded cursor-pointer hover:bg-white ${
        isSelected ? 'bg-blue-50 border border-blue-200' : ''
      }`}
      onClick={onToggleSelect}
      title="Click to select, double-click to copy"
      onDoubleClick={(e) => {
        e.stopPropagation()
        onCopy()
      }}
    >
      <span className="text-gray-400 select-none min-w-[3ch] text-right">{index + 1}</span>
      <span className={`${getCategoryColor(category)} font-semibold min-w-[8ch]`}>{category}</span>
      <span className="flex-1 break-all">{log}</span>
      <button
        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700 px-1"
        onClick={(e) => {
          e.stopPropagation()
          onCopy()
        }}
        title="Copy this log"
      >
        {isCopied ? '✓' : '📋'}
      </button>
    </div>
  )
}
