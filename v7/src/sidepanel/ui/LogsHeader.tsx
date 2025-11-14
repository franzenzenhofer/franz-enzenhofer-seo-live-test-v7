/**
 * Logs Header - Copy/Clear buttons
 */

export function LogsHeader({
  onCopyAll,
  onCopyFiltered,
  onCopySelected,
  onClear,
  onCopyReport,
  selectedCount,
}: {
  onCopyAll: () => void
  onCopyFiltered: () => void
  onCopySelected: () => void
  onClear: () => void
  onCopyReport: () => void
  selectedCount: number
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button className="text-sm border px-2 py-1 rounded hover:bg-gray-50" onClick={onCopyAll}>
        📋 Copy All
      </button>
      <button className="text-sm border px-2 py-1 rounded hover:bg-gray-50" onClick={onCopyFiltered}>
        📋 Copy Filtered
      </button>
      <button className="text-sm border px-2 py-1 rounded hover:bg-gray-50 disabled:opacity-50" onClick={onCopySelected} disabled={selectedCount === 0}>
        📋 Copy Selected ({selectedCount})
      </button>
      <button className="text-sm border px-2 py-1 rounded hover:bg-gray-50" onClick={onClear}>
        🗑️ Clear
      </button>
      <button className="text-sm border px-2 py-1 rounded hover:bg-gray-50" onClick={onCopyReport}>
        🐛 Bug Report
      </button>
    </div>
  )
}
