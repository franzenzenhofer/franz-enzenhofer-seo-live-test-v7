export const LogsControls = ({
  onCopy,
  onExport,
  onClear,
  autoScroll,
  onToggleAutoScroll,
  disableClear = false,
}: {
  onCopy: () => void
  onExport: () => void
  onClear: () => void
  autoScroll: boolean
  onToggleAutoScroll: () => void
  disableClear?: boolean
}) => (
  <div className="flex flex-wrap gap-2">
    <button
      onClick={onCopy}
      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
    >
      Copy to Clipboard
    </button>
    <button
      onClick={onExport}
      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
    >
      Export as File
    </button>
    <button
      onClick={onClear}
      disabled={disableClear}
      className={`px-3 py-1 rounded text-sm transition-colors ${
        disableClear
          ? 'bg-red-100/50 text-red-400 cursor-not-allowed'
          : 'bg-red-100 hover:bg-red-200 text-red-700'
      }`}
    >
      Clear Logs
    </button>
    <button
      onClick={onToggleAutoScroll}
      className={`px-3 py-1 rounded text-sm transition-colors ${
        autoScroll
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          : 'bg-gray-100 hover:bg-gray-200'
      }`}
    >
      Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
    </button>
  </div>
)
