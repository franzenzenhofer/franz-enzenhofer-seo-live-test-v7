/**
 * Storage Helper Functions
 */

export function getDataSize(data: unknown): number {
  try {
    return JSON.stringify(data).length
  } catch {
    return 0
  }
}
