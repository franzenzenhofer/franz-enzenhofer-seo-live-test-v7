import { showToast } from '@/shared/components/Toast'

const VALID_SETTINGS_KEYS = [
  'rule-flags',
  'globalRuleVariables',
  'ui:autoClear',
  'ui:autoRun',
  'ui:preserveLog',
  'ui:pinnedRules'
] as const

export const importSettings = async (file: File): Promise<void> => {
  try {
    const text = await file.text()
    const data = JSON.parse(text)

    // Validate and filter to only known keys
    const importData: Record<string, unknown> = {}
    for (const key of VALID_SETTINGS_KEYS) {
      if (key in data) {
        importData[key] = data[key]
      }
    }

    // Save to storage
    await chrome.storage.local.set(importData)

    showToast('Settings imported successfully', 'success')
    setTimeout(() => window.location.reload(), 1000)
  } catch (err) {
    showToast(`Import failed: ${(err as Error).message}`, 'error')
    throw err
  }
}
