import { registry } from '@/rules/registry'
import { DEFAULT_FAVORITES, PINNED_RULE_STORAGE_KEY, toPinnedRecord } from '@/shared/favorites'
import { STORAGE_KEYS } from '@/shared/storage-keys'

export { DEFAULT_FAVORITES } from '@/shared/favorites'

const readFlags = async (): Promise<Record<string, boolean>> => {
  const { [STORAGE_KEYS.RULES.FLAGS]: v } = await chrome.storage.local.get(STORAGE_KEYS.RULES.FLAGS)
  return (v as Record<string, boolean>) || {}
}

export const getEnabledRules = async () => {
  const flags = await readFlags()
  // Apply user flags to rules (all rules enabled by default)
  return registry.map((rule) => {
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
