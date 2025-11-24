import { showToast } from '@/shared/components/Toast'
import { STORAGE_KEYS } from '@/shared/storage-keys'

export const SETTINGS_KEYS = [
  STORAGE_KEYS.RULES.FLAGS,
  STORAGE_KEYS.RULES.VARIABLES,
  STORAGE_KEYS.UI.AUTO_CLEAR,
  STORAGE_KEYS.UI.AUTO_RUN,
  STORAGE_KEYS.UI.DEBUG,
  STORAGE_KEYS.UI.PINNED_RULES,
  STORAGE_KEYS.UI.BLOCKLIST,
] as const

export const exportSettings = async (): Promise<void> => {
  const data = await chrome.storage.local.get(SETTINGS_KEYS)

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `f19n-settings-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)

  showToast('Settings exported successfully', 'success')
}
