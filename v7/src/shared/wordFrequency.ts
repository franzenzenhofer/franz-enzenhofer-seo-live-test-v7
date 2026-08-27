import { walkNodes } from './domFacts.walk'

const MAX_UNIQUE_WORDS = 20_000

export const topWords = (root: Node | null, limit = 5): Array<[string, number]> => {
  const frequencies = new Map<string, number>()
  walkNodes(root, (node) => {
    if (node.nodeType !== 3) return
    let word = ''
    const flush = () => {
      if (word.length >= 4) {
        if (!frequencies.has(word) && frequencies.size >= MAX_UNIQUE_WORDS) {
          throw new Error('Visible text exceeds the bounded unique-word contract')
        }
        frequencies.set(word, (frequencies.get(word) || 0) + 1)
      }
      word = ''
    }
    for (const char of node.nodeValue || '') {
      if (/[a-z0-9]/i.test(char)) word = word.length < 100 ? word + char.toLowerCase() : word
      else flush()
    }
    flush()
  })
  return [...frequencies].sort((a, b) => b[1] - a[1]).slice(0, limit)
}
