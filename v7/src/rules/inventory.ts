import { registry } from './registry'

import type { RuleProvenance } from '@/core/types'

export type RuleSummary = {
  id: string
  name: string
  enabledByDefault: boolean
  what?: string
  provenance: RuleProvenance
  references: string[]
}

export const rulesInventory: RuleSummary[] = registry
  .map((rule) => ({
    id: rule.id,
    name: rule.name,
    enabledByDefault: rule.enabled,
    what: rule.what,
    provenance: rule.meta.provenance,
    references: rule.meta.references,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))
