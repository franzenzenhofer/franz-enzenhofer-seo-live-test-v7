type ResultLike = { name?: string; message?: string; runIdentifier?: string }

export const dedupRunner = <T extends ResultLike>(list: T[]): T[] => {
  const seen = new Map<string, number>()
  list.forEach((r, i) => {
    const key = r.name === 'system:runner' ? `${r.name}:${r.message}` : `${r.name}:${r.runIdentifier || ''}`
    if (r.name === 'system:runner' && !seen.has(key)) seen.set(key, i)
    else if (r.name !== 'system:runner') seen.set(key, i)
  })
  return list.filter((r, i) => {
    const key = r.name === 'system:runner' ? `${r.name}:${r.message}` : `${r.name}:${r.runIdentifier || ''}`
    return seen.get(key) === i
  })
}
