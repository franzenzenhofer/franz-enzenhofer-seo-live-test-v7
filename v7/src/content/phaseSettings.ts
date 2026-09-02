import { isDebugRuleId } from '@/rules/debugRules'
import { registry } from '@/rules/registry'
import { STORAGE_KEYS } from '@/shared/storage-keys'

export const readPhaseExecution = async () => {
  const keys = [STORAGE_KEYS.RULES.FLAGS, STORAGE_KEYS.RULES.VARIABLES, STORAGE_KEYS.UI.DEBUG] as const
  const stored = await chrome.storage.local.get([...keys])
  const flags = (stored[STORAGE_KEYS.RULES.FLAGS] || {}) as Record<string, boolean>
  const variables = (stored[STORAGE_KEYS.RULES.VARIABLES] || {}) as Record<string, unknown>
  const debug = stored[STORAGE_KEYS.UI.DEBUG] === true
  // Debug rules run only when the "Debug data" setting is on; otherwise they are absent
  const visible = debug ? registry : registry.filter((rule) => !isDebugRuleId(rule.id))
  const rules = visible.map((rule) => {
    const enabled = flags[rule.id]
    return typeof enabled === 'boolean' ? { ...rule, enabled } : rule
  })
  return { rules, globals: { variables } }
}
