export const sampleDelimitedTokens = (
  value: string,
  separators = ',',
  watch: readonly string[] = [],
  limit = 10,
) => {
  const values: string[] = []
  const matches = new Set<string>()
  let total = 0
  let start = 0
  const finish = (end: number) => {
    const token = value.slice(start, end).trim()
    if (!token) return
    total++
    const normalized = token.toLowerCase()
    if (watch.includes(normalized)) matches.add(normalized)
    if (values.length < limit) values.push(token.slice(0, 512))
  }
  for (let index = 0; index < value.length; index++) {
    if (!separators.includes(value[index]!)) continue
    finish(index)
    start = index + 1
  }
  finish(value.length)
  return { values, total, shown: values.length, truncated: total > values.length, matches: [...matches] }
}
