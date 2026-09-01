import type { Result, ResultDetails } from '@/core/types'

export const RESULT_LIMITS = { array: 10, detailsBytes: 8_192, message: 2_000 } as const
const MAX_DEPTH = 6
const MAX_KEYS = 50
const TRUNCATION_MARK = '...[truncated]'
// Details must fit the byte contract, but nothing below it may be thrown away
// eagerly: try generous limits first and only tighten while the payload does
// not fit. A cut is never silent - strings get a marker, arrays get
// evidenceBounds with the exact total/shown counts.
const LADDER: Array<{ str: number; arr: number }> = [
  { str: 8_000, arr: 500 },
  { str: 4_000, arr: 200 },
  { str: 2_000, arr: 100 },
  { str: 2_000, arr: 50 },
  { str: 1_000, arr: 25 },
  { str: 500, arr: 10 },
  { str: 250, arr: 10 },
  { str: 100, arr: 10 },
]
const encoder = new TextEncoder()

const bound = (value: unknown, depth: number, limits: { str: number; arr: number }, seen: WeakSet<object>): unknown => {
  if (typeof value === 'string') return value.length > limits.str ? value.slice(0, limits.str) + TRUNCATION_MARK : value
  if (value === null || typeof value !== 'object') return value
  if (depth >= MAX_DEPTH || seen.has(value)) return '[bounded]'
  seen.add(value)
  if (Array.isArray(value)) return value.slice(0, limits.arr).map((item) => bound(item, depth + 1, limits, seen))
  return Object.fromEntries(Object.entries(value).slice(0, MAX_KEYS).map(([key, item]) => [key, bound(item, depth + 1, limits, seen)]))
}

const byteLength = (value: unknown) => encoder.encode(JSON.stringify(value)).length

export const boundDetails = (details: ResultDetails): ResultDetails => {
  for (const limits of LADDER) {
    const candidate = bound(details, 0, limits, new WeakSet()) as ResultDetails
    const evidenceBounds = Object.fromEntries(Object.entries(details)
      .filter(([, value]) => Array.isArray(value) && value.length > limits.arr)
      .map(([key, value]) => [key, { total: (value as unknown[]).length, shown: limits.arr, truncated: true }]))
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
