import type { Result } from '@/core/types'

const MAX_STRING = 4_000
const MAX_ARRAY = 50
const MAX_KEYS = 50
const MAX_DEPTH = 6

const bound = (value: unknown, depth: number, seen: WeakSet<object>): unknown => {
  if (typeof value === 'string') return value.slice(0, MAX_STRING)
  if (value === null || typeof value !== 'object') return value
  if (depth >= MAX_DEPTH || seen.has(value)) return '[bounded]'
  seen.add(value)
  if (Array.isArray(value)) return value.slice(0, MAX_ARRAY).map((item) => bound(item, depth + 1, seen))
  const output: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value).slice(0, MAX_KEYS)) {
    output[key] = bound(item, depth + 1, seen)
  }
  return output
}

export const boundResult = (result: Result): Result =>
  bound(result, 0, new WeakSet()) as Result

export const boundResults = (results: Result[]) => results.map(boundResult)
