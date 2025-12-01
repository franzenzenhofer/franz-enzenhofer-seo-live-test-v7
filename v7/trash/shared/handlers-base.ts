// Moved to trash on 2025-11-26: unused base handler wrapper.
/**
 * Base Event Handler Wrapper - DRY base for all handlers
 */

import { Logger } from './logger.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createLoggedHandler<T extends (...args: any[]) => void | Promise<void>>(
  handler: T,
  category: string,
  action: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataExtractor: (...args: any[]) => Record<string, unknown>
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((...args: any[]) => {
    Logger.logSync('ui', action, dataExtractor(...args))
    const result = handler(...args)
    if (result && typeof result === 'object' && 'then' in result) {
      result.catch((error) => {
        Logger.logError(`${action} failed`, error).catch(() => {})
      })
    }
    return result
  }) as T
}
