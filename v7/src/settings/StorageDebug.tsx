import { useState, useEffect } from 'react'

export const StorageDebug = () => {
  const [storage, setStorage] = useState<Record<string, unknown>>({})
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const loadStorage = async () => {
      const all = await chrome.storage.local.get(null)
      setStorage(all)
    }

    loadStorage()

    // Update on changes
    const listener = () => loadStorage()
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  // Calculate storage size
  const storageSize = new Blob([JSON.stringify(storage)]).size
  const storageMB = (storageSize / 1024 / 1024).toFixed(2)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(storage, null, 2))
    alert('Storage copied to clipboard!')
  }

  return (
    <div className="border rounded bg-gray-50 p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h2 className="text-lg font-semibold">🔍 Storage Inspector (Debug)</h2>
        <span className="text-sm text-gray-600">
          {storageMB} MB · {Object.keys(storage).length} keys
        </span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-600">
            View all data stored by this extension. Use this for debugging.
          </p>

          <button
            onClick={copyToClipboard}
            className="text-sm text-blue-600 underline"
          >
            Copy all to clipboard
          </button>

          <div className="max-h-96 overflow-y-auto border rounded bg-white">
            {Object.keys(storage).sort().map(key => (
              <details key={key} className="border-b p-3">
                <summary className="cursor-pointer font-mono text-sm">
                  {key}
                  <span className="ml-2 text-gray-500">
                    ({typeof storage[key]})
                  </span>
                </summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                  {JSON.stringify(storage[key], null, 2)}
                </pre>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
