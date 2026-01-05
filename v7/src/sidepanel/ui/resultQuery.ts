import { matchesPriorityFilter, type PriorityFilter } from './priorityFilter'

import { isResultUnconfigured, type Result } from '@/shared/results'

type TokenKey = 'id' | 'label' | 'name'
type MatchQuery = { types?: string[]; q?: string; priority?: PriorityFilter | null }

const tokenKeys = new Set(['id', 'rule', 'label', 'name'])

const parseQuery = (q?: string) => {
  const tokens: Record<TokenKey, string[]> = { id: [], label: [], name: [] }
  const text: string[] = []
  const parts = (q || '').trim().toLowerCase().split(/\s+/).filter(Boolean)
  for (const part of parts) {
    const idx = part.indexOf(':')
    if (idx > 0) {
      const key = part.slice(0, idx)
      const value = part.slice(idx + 1)
      if (tokenKeys.has(key) && value) {
        const target = (key === 'rule' ? 'id' : key) as TokenKey
        tokens[target].push(value)
        continue
      }
    }
    text.push(part)
  }
  return { tokens, text: text.join(' ') }
}

const matchAny = (value: string | null | undefined, needles: string[]) => {
  if (!needles.length) return true
  const haystack = (value || '').toLowerCase()
  return needles.some((needle) => haystack.includes(needle))
}

export const matchesResult = (result: Result, { types, q, priority }: MatchQuery) => {
  if (types?.includes('unconfigured')) return isResultUnconfigured(result)
  if (types && !types.includes(result.type)) return false
  if (!matchesPriorityFilter(result.priority, priority)) return false
  const { tokens, text } = parseQuery(q)
  if (!matchAny(result.ruleId, tokens.id)) return false
  if (!matchAny(result.label, tokens.label)) return false
  if (!matchAny(result.name, tokens.name)) return false
  if (text) {
    const haystack = `${result.label} ${result.name} ${result.ruleId ?? ''} ${result.what ?? ''} ${result.message}`.toLowerCase()
    if (!haystack.includes(text)) return false
  }
  return true
}
