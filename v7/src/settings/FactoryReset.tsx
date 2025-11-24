import { DEFAULT_BLOCKLIST } from '@/shared/blocklist'
import { showToast } from '@/shared/components/Toast'
import { DEFAULT_FAVORITES, PINNED_RULE_STORAGE_KEY, toPinnedRecord } from '@/shared/favorites'
import { STORAGE_KEYS } from '@/shared/storage-keys'

const DEFAULT_PINNED = toPinnedRecord([...DEFAULT_FAVORITES])
const DEFAULT_BLOCKED = Array.from(DEFAULT_BLOCKLIST)

export const FactoryReset = () => {
  const resetAll = async () => {
    const confirmed = window.confirm('Reset all Live Test data? This clears settings, favorites, run history, and cached results.')
    if (!confirmed) return
    await chrome.storage.local.clear()
    await chrome.storage.session.clear().catch(() => {})
    await chrome.storage.local.set({
      [PINNED_RULE_STORAGE_KEY]: DEFAULT_PINNED,
      [STORAGE_KEYS.UI.BLOCKLIST]: DEFAULT_BLOCKED,
    })
    showToast('Factory reset complete', 'success')
    setTimeout(() => window.location.reload(), 300)
  }

  return (
    <div className="border rounded bg-gray-50 p-4 space-y-2">
      <div>
        <h2 className="text-lg font-semibold">Factory Reset</h2>
        <p className="text-xs text-gray-600 mt-1">
          Clears all stored settings, favorites, history, and cached results. Reverts to defaults.
        </p>
      </div>
      <button
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
        onClick={resetAll}
        type="button"
      >
        Reset &amp; clean everything
      </button>
    </div>
  )
}
