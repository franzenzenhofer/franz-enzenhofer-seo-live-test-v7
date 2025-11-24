import { useEffect, useState } from 'react'

import { DEFAULT_BLOCKLIST, normalizeBlocklistEntries } from '@/shared/blocklist'
import { showToast } from '@/shared/components/Toast'
import { useStorageSetting } from '@/shared/hooks/useStorageSetting'
import { STORAGE_KEYS } from '@/shared/storage-keys'

const DEFAULT_LIST = Array.from(DEFAULT_BLOCKLIST)

export const BlocklistSettings = () => {
  const [entries, setEntries] = useStorageSetting<string[]>(STORAGE_KEYS.UI.BLOCKLIST, DEFAULT_LIST)
  const [input, setInput] = useState(entries.join('\n'))

  useEffect(() => {
    setInput(entries.join('\n'))
  }, [entries])

  const save = async () => {
    const normalized = normalizeBlocklistEntries(input)
    await setEntries(normalized)
    showToast(normalized.length ? 'Blocklist saved' : 'Blocklist cleared', 'success')
  }

  const reset = async () => {
    setInput(DEFAULT_LIST.join('\n'))
    await setEntries(DEFAULT_LIST)
    showToast('Blocklist reset to defaults', 'success')
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div>
        <h2 className="text-lg font-semibold">URL Blocklist</h2>
        <p className="text-xs text-gray-600 mt-1">
          Skip running on the URLs/domains listed below (one per line). Useful for Google tools and internal pages.
        </p>
      </div>
      <textarea
        className="w-full h-32 border rounded-md p-2 text-sm"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="example.com&#10;chrome://&#10;developers.google.com/speed/pagespeed/insights"
      />
      <div className="flex flex-wrap gap-2">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          onClick={save}
          type="button"
        >
          Save blocklist
        </button>
        <button
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
          onClick={reset}
          type="button"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  )
}
