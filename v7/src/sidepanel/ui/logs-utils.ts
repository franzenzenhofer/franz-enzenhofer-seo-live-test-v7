/**
 * Logs Utilities - Shared functions for logs
 */

export function extractCategory(log: string): string {
  const match = log.match(/\]\s+([a-z]+):/i)
  return match?.[1] || 'unknown'
}
