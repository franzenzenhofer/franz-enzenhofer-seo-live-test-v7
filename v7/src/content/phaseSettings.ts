import { registry } from '@/rules/registry'
import { STORAGE_KEYS } from '@/shared/storage-keys'

export const readPhaseExecution = async () => {
  const keys = [STORAGE_KEYS.RULES.FLAGS, STORAGE_KEYS.RULES.VARIABLES] as const
  const stored = await chrome.storage.local.get([...keys])
  const flags = (stored[STORAGE_KEYS.RULES.FLAGS] || {}) as Record<string, boolean>
  const variables = (stored[STORAGE_KEYS.RULES.VARIABLES] || {}) as Record<string, unknown>
  const rules = registry.map((rule) => {
    const enabled = flags[rule.id]
    return typeof enabled === 'boolean' ? { ...rule, enabled } : rule
  })
  return { rules, globals: { variables } }
}
