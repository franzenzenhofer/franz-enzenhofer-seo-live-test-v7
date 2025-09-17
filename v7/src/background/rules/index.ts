import { registry } from '@/rules/registry'

const FLAGS_KEY = 'rule-flags'
const readFlags = async (): Promise<Record<string, boolean>> => {
  const { [FLAGS_KEY]: v } = await chrome.storage.local.get(FLAGS_KEY)
  return (v as Record<string, boolean>) || {}
}

export const getEnabledRules = async () => {
  const flags = await readFlags()
  return registry.filter((r)=> (flags[r.id] ?? r.enabled))
}
export const seedDefaults = async () => { /* code-defined rules; no seeding needed */ }
