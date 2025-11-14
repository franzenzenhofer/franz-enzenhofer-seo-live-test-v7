/**
 * Base Decorator Helper - DRY base for function logging
 */

import { Logger, type LogCategory } from './logger.js'

export async function loggedFunctionExecution<T>(
  category: LogCategory,
  name: string,
  fn: () => Promise<T> | T,
  args: unknown[]
): Promise<T> {
  const id = Math.random().toString(36).slice(2, 9)
  Logger.logSync(category, `${name} start`, { id, args: args.length })
  const start = performance.now()
  try {
    const result = await fn()
    const duration = (performance.now() - start).toFixed(2)
    await Logger.log(category, `${name} done`, { id, duration: `${duration}ms`, hasResult: result !== undefined })
    return result
  } catch (error) {
    const duration = (performance.now() - start).toFixed(2)
    await Logger.logError(name, error, { id, duration: `${duration}ms` })
    throw error
  }
}
