import type { Result, ResultDetails } from '@/core/types'

export const RESULT_LIMITS = { array: 10, detailsBytes: 8_192, message: 2_000 } as const
const MAX_DEPTH = 6
const MAX_KEYS = 50
const encoder = new TextEncoder()

const bound = (value: unknown, depth: number, stringLimit: number, seen: WeakSet<object>): unknown => {
  if (typeof value === 'string') return value.slice(0, stringLimit)
  if (value === null || typeof value !== 'object') return value
  if (depth >= MAX_DEPTH || seen.has(value)) return '[bounded]'
  seen.add(value)
  if (Array.isArray(value)) return value.slice(0, RESULT_LIMITS.array).map((item) => bound(item, depth + 1, stringLimit, seen))
  return Object.fromEntries(Object.entries(value).slice(0, MAX_KEYS).map(([key, item]) => [key, bound(item, depth + 1, stringLimit, seen)]))
}

const byteLength = (value: unknown) => encoder.encode(JSON.stringify(value)).length

export const boundDetails = (details: ResultDetails): ResultDetails => {
  const evidenceBounds = Object.fromEntries(Object.entries(details)
    .filter(([, value]) => Array.isArray(value) && value.length > RESULT_LIMITS.array)
    .map(([key, value]) => [key, { total: (value as unknown[]).length, shown: RESULT_LIMITS.array, truncated: true }]))
  for (const stringLimit of [2_000, 1_000, 500, 250, 100]) {
    const candidate = bound(details, 0, stringLimit, new WeakSet()) as ResultDetails
    if (Object.keys(evidenceBounds).length) candidate['evidenceBounds'] = evidenceBounds
    if (byteLength(candidate) <= RESULT_LIMITS.detailsBytes) return candidate
  }
  return { truncated: true, reason: 'Details exceeded the 8 KB storage contract.' }
}

export const boundResult = (result: Result): Result => ({
  ...result,
  name: result.name.slice(0, 256),
  label: result.label.slice(0, 64),
  message: result.message.slice(0, RESULT_LIMITS.message),
  ...(result.details ? { details: boundDetails(result.details) } : {}),
})

export const boundResults = (results: Result[]): Result[] => results.map(boundResult)
