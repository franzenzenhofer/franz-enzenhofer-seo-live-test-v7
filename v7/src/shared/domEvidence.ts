export const EVIDENCE_LIMIT = 10

export const sampleElements = <T extends Element>(elements: ArrayLike<T>, limit = EVIDENCE_LIMIT) => {
  const sample: T[] = []
  const total = elements.length
  for (let index = 0; index < total; index++) {
    const element = elements[index]
    if (!element) continue
    if (sample.length < limit) sample.push(element)
  }
  return { sample, total, shown: sample.length, truncated: total > sample.length }
}

export const sampleMatchingElements = <T extends Element>(
  elements: ArrayLike<T>,
  matches: (element: T) => boolean,
  limit = EVIDENCE_LIMIT,
) => {
  const sample: T[] = []
  let total = 0
  for (let index = 0; index < elements.length; index++) {
    const element = elements[index]
    if (!element || !matches(element)) continue
    total++
    if (sample.length < limit) sample.push(element)
  }
  return { sample, total, shown: sample.length, truncated: total > sample.length }
}
