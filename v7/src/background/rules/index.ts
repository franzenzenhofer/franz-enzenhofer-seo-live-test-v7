import { registry } from '@/rules/registry'

const FLAGS_KEY = 'rule-flags'
const PIN_KEY = 'ui:pinnedRules'

// Default favorited rules (shown on fresh install)
export const DEFAULT_FAVORITES = [
  'head-title',           // Title Present
  'head:title',           // Title Length
  'head-canonical',       // Canonical Link
  'body:h1',              // H1 Present
  'head-meta-description' // Meta Description
] as const

const readFlags = async (): Promise<Record<string, boolean>> => {
  const { [FLAGS_KEY]: v } = await chrome.storage.local.get(FLAGS_KEY)
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
  const { [PIN_KEY]: existing } = await chrome.storage.local.get(PIN_KEY)
  if (existing) return // Already initialized

  const defaultPinned: Record<string, boolean> = {}
  DEFAULT_FAVORITES.forEach((ruleId) => {
    defaultPinned[ruleId] = true
  })
  await chrome.storage.local.set({ [PIN_KEY]: defaultPinned })
}
