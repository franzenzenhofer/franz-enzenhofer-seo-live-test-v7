type RuleNameCarrier = { what?: string | null; name?: string | null }

export const formatRuleName = (item: RuleNameCarrier) => {
  if (item?.what && item.what.length > 0) return item.what
  if (item?.name) return item.name.replace(/([a-z])([A-Z])/g, '$1 $2')
  return ''
}
