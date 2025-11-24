const openInternalPage = (path: string) => {
  const url = chrome.runtime.getURL(path)
  chrome.tabs.create({ url }).catch(() => {})
}

export const DebugTools = () => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Debug Tools</h2>
        <p className="text-xs text-gray-600 mt-1">
          Extra links available while Debug data is enabled.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          onClick={() => openInternalPage('src/logs.html')}
          type="button"
        >
          Open logs
        </button>
        <button
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm font-medium"
          onClick={() => openInternalPage('src/ruleruns.html')}
          type="button"
        >
          Run history
        </button>
      </div>
    </div>
  )
}
