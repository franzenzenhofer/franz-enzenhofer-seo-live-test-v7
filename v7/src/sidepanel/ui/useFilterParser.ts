import { useMemo } from 'react'

// Parse filter query to extract types and text
// Examples:
// "ok" -> types: ['ok'], text: ""
// "ok canonical" -> types: ['ok'], text: "canonical"
// "warn error" -> types: ['warn', 'error'], text: ""
// "canonical" -> types: [], text: "canonical"
export const useFilterParser = (query: string) => {
  return useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return { types: [], text: '', hasTypeFilter: false }

    const words = trimmed.split(/\s+/)
    const typeKeywords = new Set(['ok', 'warn', 'error', 'info', 'unconfigured'])
    const foundTypes: string[] = []
    const textWords: string[] = []

    for (const word of words) {
      if (typeKeywords.has(word)) {
        foundTypes.push(word)
      } else {
        textWords.push(word)
      }
    }

    return {
      types: foundTypes,
      text: textWords.join(' '),
      hasTypeFilter: foundTypes.length > 0,
    }
  }, [query])
}
