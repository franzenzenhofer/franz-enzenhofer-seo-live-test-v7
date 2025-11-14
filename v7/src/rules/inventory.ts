import { registry } from './registry'

export type RuleSummary = { id: string; name: string; enabledByDefault: boolean }

export const rulesInventory: RuleSummary[] = registry
  .map((rule) => ({ id: rule.id, name: rule.name, enabledByDefault: rule.enabled }))
  .sort((a, b) => a.name.localeCompare(b.name))
