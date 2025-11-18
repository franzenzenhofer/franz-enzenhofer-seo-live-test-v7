type ResultLike = { name?: string; message?: string; runIdentifier?: string; ruleId?: string }

export const dedupRunner = <T extends ResultLike>(list: T[]): T[] => {
  const seen = new Map<string, number>()
  const keyFor = (r: ResultLike) => {
    if (r.ruleId) return `${r.ruleId}:${r.runIdentifier || ''}`
    if (r.name === 'system:runner') return `${r.name}:${r.message}`
    return `${r.name}:${r.runIdentifier || ''}`
  }
  list.forEach((r, i) => {
    const key = keyFor(r)
    if (r.name === 'system:runner' && !seen.has(key)) seen.set(key, i)
    else if (r.name !== 'system:runner') seen.set(key, i)
  })
  return list.filter((r, i) => {
    const key = keyFor(r)
    return seen.get(key) === i
  })
}
