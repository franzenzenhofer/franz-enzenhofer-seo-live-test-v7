import { showToast } from '@/shared/components/Toast'

const SETTINGS_KEYS = [
  'rule-flags',
  'globalRuleVariables',
  'ui:autoClear',
  'ui:autoRun',
  'ui:debug',
  'ui:pinnedRules'
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
