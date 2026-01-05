import type { Result } from '@/shared/results'

export const buildDomHighlight = (result: Result) => {
  if (!result.details) return { selectors: [], colors: undefined as string[] | undefined }
  const domPaths = Array.isArray(result.details['domPaths'])
    ? (result.details['domPaths'].filter((p) => typeof p === 'string' && p.trim()) as string[])
    : typeof result.details['domPath'] === 'string' && result.details['domPath'].trim()
      ? [result.details['domPath']]
      : []
  const domPathColors = Array.isArray(result.details['domPathColors'])
    ? result.details['domPathColors'].filter((c): c is string => typeof c === 'string' && Boolean(c.trim()))
    : undefined
  return { selectors: domPaths, colors: domPathColors }
}

export const buildDetailPayload = (details: Result['details']) => {
  if (!details) return undefined
  const clean = { ...details }
  delete (clean as Record<string, unknown>)['snippet']
  delete (clean as Record<string, unknown>)['domPath']
  delete (clean as Record<string, unknown>)['domPaths']
  delete (clean as Record<string, unknown>)['domPathColors']
  return clean
}

export const extractSnippet = (details: Result['details']) =>
  typeof details?.snippet === 'string' ? details.snippet : null
