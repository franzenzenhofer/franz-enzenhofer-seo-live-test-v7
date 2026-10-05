// The Comparison row of a URL comparison (FORMATTING.md F2): a closed verdict that names the
// first differing URL component, e.g. "Differs from current page URL (query)".
const COMPONENTS = [['scheme', 'protocol'], ['host', 'host'], ['path', 'pathname'], ['query', 'search'], ['fragment', 'hash']] as const

export const differingComponent = (observed: string, target: string): string | null => {
  try {
    const a = new URL(observed), b = new URL(target)
    const hit = COMPONENTS.find(([, part]) => a[part] !== b[part])
    return hit ? hit[0] : null
  } catch {
    return observed === target ? null : 'URL'
  }
}

/** `targetName` in lower case as it reads in the sentence, e.g. "current page URL". */
export const urlComparison = (observed: string, target: string, targetName: string): string => {
  const component = differingComponent(observed, target)
  return component ? `Differs from ${targetName} (${component})` : `Equals ${targetName}`
}
