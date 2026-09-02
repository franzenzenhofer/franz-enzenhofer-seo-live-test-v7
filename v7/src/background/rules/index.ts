import { isDebugRuleId } from '@/rules/debugRules'
import { registry } from '@/rules/registry'
import { DEFAULT_FAVORITES, PINNED_RULE_STORAGE_KEY, toPinnedRecord } from '@/shared/favorites'
import { STORAGE_KEYS } from '@/shared/storage-keys'

export { DEFAULT_FAVORITES } from '@/shared/favorites'

const readRunConfig = async (): Promise<{ flags: Record<string, boolean>; debug: boolean }> => {
  const stored = await chrome.storage.local.get([STORAGE_KEYS.RULES.FLAGS, STORAGE_KEYS.UI.DEBUG])
  return {
    flags: (stored[STORAGE_KEYS.RULES.FLAGS] as Record<string, boolean>) || {},
    debug: stored[STORAGE_KEYS.UI.DEBUG] === true,
  }
}

export const getEnabledRules = async () => {
  const { flags, debug } = await readRunConfig()
  // Debug rules run only when the "Debug data" setting is on; otherwise they are absent
  const visible = debug ? registry : registry.filter((rule) => !isDebugRuleId(rule.id))
  // Apply user flags to rules (all rules enabled by default)
  return visible.map((rule) => {
    const override = flags[rule.id]
    if (typeof override === 'boolean') {
      return { ...rule, enabled: override }
    }
    return rule
  })
}

export const seedDefaults = async (): Promise<void> => {
  const { [PINNED_RULE_STORAGE_KEY]: existing } = await chrome.storage.local.get(PINNED_RULE_STORAGE_KEY)
  if (existing) return // Already initialized

  await chrome.storage.local.set({ [PINNED_RULE_STORAGE_KEY]: toPinnedRecord([...DEFAULT_FAVORITES]) })
}
