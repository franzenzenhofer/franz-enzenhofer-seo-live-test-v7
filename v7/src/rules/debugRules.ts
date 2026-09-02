export const isDebugRuleId = (id: string): boolean => id.startsWith('debug:')

type DebugFilterable = { ruleId?: string | null; label?: string }

export const filterDebugResults = <T extends DebugFilterable>(items: T[], debugEnabled: boolean): T[] => {
  if (debugEnabled) return items
  return items.filter((item) => {
    if (item.ruleId) return !isDebugRuleId(item.ruleId)
    return item.label !== 'DEBUG'
  })
}
