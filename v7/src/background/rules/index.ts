import { registry } from '@/rules/registry'
import { resolveEnabledRules } from '@/rules/autoEnable'
import { TOKEN_KEY } from '@/shared/auth'

const FLAGS_KEY = 'rule-flags'
const PIN_KEY = 'ui:pinnedRules'

// Default favorited rules (shown on fresh install)
export const DEFAULT_FAVORITES = ['head-meta-description'] as const

const readFlags = async (): Promise<Record<string, boolean>> => {
  const { [FLAGS_KEY]: v } = await chrome.storage.local.get(FLAGS_KEY)
  return (v as Record<string, boolean>) || {}
}

export const getEnabledRules = async () => {
  const [flags, extras] = await Promise.all([
    readFlags(),
    chrome.storage.local.get(['globalRuleVariables', TOKEN_KEY]),
  ])
  const vars = (extras['globalRuleVariables'] as Record<string, unknown>) || {}
  const hasToken = Boolean(extras[TOKEN_KEY])
  return resolveEnabledRules(registry, { flags, vars, hasToken })
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
