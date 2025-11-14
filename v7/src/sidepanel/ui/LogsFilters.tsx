/**
 * Logs Filters - Category filters and search
 */

const LOG_CATEGORIES = ['all', 'ui', 'storage', 'chrome', 'dom', 'rule', 'rules', 'event', 'msg', 'perf', 'error', 'warn', 'offscreen', 'run', 'page', 'req', 'nav', 'auth', 'content', 'alarm'] as const
export type LogCategory = typeof LOG_CATEGORIES[number]

export function LogsFilters({
  searchText,
  onSearchChange,
  filterCategory,
  onFilterChange,
  categoryCounts,
  totalLogs,
  onSelectAll,
  onDeselectAll,
}: {
  searchText: string
  onSearchChange: (text: string) => void
  filterCategory: LogCategory
  onFilterChange: (category: LogCategory) => void
  categoryCounts: Record<string, number>
  totalLogs: number
  onSelectAll: () => void
  onDeselectAll: () => void
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search logs..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          className="text-sm border px-2 py-1 rounded flex-1"
        />
        <button className="text-xs border px-2 py-1 rounded hover:bg-gray-50" onClick={onSelectAll}>
          Select All
        </button>
        <button className="text-xs border px-2 py-1 rounded hover:bg-gray-50" onClick={onDeselectAll}>
          Deselect All
        </button>
      </div>
      <div className="flex gap-1 flex-wrap">
        {LOG_CATEGORIES.map(cat => {
          const count = cat === 'all' ? totalLogs : categoryCounts[cat] || 0
          if (cat !== 'all' && count === 0) return null
          return (
            <button
              key={cat}
              className={`text-xs px-2 py-1 rounded border ${
                filterCategory === cat ? 'bg-blue-100 border-blue-500 font-semibold' : 'border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onFilterChange(cat)}
            >
              {cat} {count > 0 && `(${count})`}
            </button>
          )
        })}
      </div>
    </>
  )
}
