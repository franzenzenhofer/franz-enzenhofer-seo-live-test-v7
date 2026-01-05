import { useMemo } from 'react'

import { buildPriorityFilter, parsePriorityToken, type PriorityToken } from './priorityFilter'

import { resultTypeLabels } from '@/shared/colors'

const keywordToType = (() => {
  const map = new Map<string, string>()
  Object.entries(resultTypeLabels).forEach(([type, label]) => {
    map.set(type.toLowerCase(), type)
    map.set(label.toLowerCase(), type)
  })
  map.set('error', 'error')
  map.set('failed', 'error')
  map.set('runtime', 'runtime_error')
  map.set('runtime_error', 'runtime_error')
  map.set('rule', 'runtime_error')
  map.set('unconfigured', 'unconfigured')
  return map
})()

// Parse filter query to extract types and text
// Examples:
// "ok" -> types: ['ok'], text: ""
// "ok canonical" -> types: ['ok'], text: "canonical"
// "warn error" -> types: ['warn', 'error'], text: ""
// "canonical" -> types: [], text: "canonical"
export const useFilterParser = (query: string) => {
  return useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return { types: [], text: '', hasTypeFilter: false, priorityFilter: null, priorityLabel: '' }

    const words = trimmed.split(/\s+/)
    const foundTypes: string[] = []
    const textWords: string[] = []
    const priorityTokens: PriorityToken[] = []

    for (const word of words) {
      const type = keywordToType.get(word)
      if (type) {
        foundTypes.push(type)
        continue
      }
      const priorityToken = parsePriorityToken(word)
      if (priorityToken) {
        priorityTokens.push(priorityToken)
        continue
      }
      textWords.push(word)
    }

    const priorityFilter = buildPriorityFilter(priorityTokens)
    const priorityLabel = priorityFilter ? priorityFilter.raw.join(', ') : ''
    return {
      types: foundTypes,
      text: textWords.join(' '),
      hasTypeFilter: foundTypes.length > 0,
      priorityFilter,
      priorityLabel,
    }
  }, [query])
}
