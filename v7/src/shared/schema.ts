export const hasPath = (o: unknown, path: string): boolean => {
  let cur: unknown = o
  for (const k of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return false
    cur = (cur as Record<string, unknown>)[k]
  }
  return !!cur
}

export const missingPaths = (o: unknown, paths: string[]): string[] => paths.filter((p) => !hasPath(o, p))
