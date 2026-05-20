import { SETTINGS_KEYS } from './exportSettings'

import { showToast } from '@/shared/components/Toast'
import { ImportSettings } from '@/shared/schemas'

export const importSettings = async (file: File): Promise<void> => {
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    const parseResult = ImportSettings.safeParse(parsed)
    if (!parseResult.success) {
      throw new Error(`Invalid settings file: ${parseResult.error.issues[0]?.message || 'schema mismatch'}`)
    }
    const data = parseResult.data

    // Validate and filter to only known keys
    const importData: Record<string, unknown> = {}
    for (const key of SETTINGS_KEYS) {
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
