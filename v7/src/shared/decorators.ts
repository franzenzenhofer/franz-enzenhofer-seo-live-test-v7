/**
 * Function Decorators and Wrappers for Automatic Logging - Super DRY
 */

import { type LogCategory } from './logger.js'
import { loggedFunctionExecution } from './decorators-base.js'

export function logged(category: LogCategory) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    descriptor.value = async function (...args: unknown[]) {
      return loggedFunctionExecution(category, propertyKey, () => originalMethod.apply(this, args), args)
    }
    return descriptor
  }
}

export function loggedFunction<T extends (...args: unknown[]) => Promise<unknown>>(fn: T, category: LogCategory, name: string): T {
  return (async (...args: unknown[]) => loggedFunctionExecution(category, name, () => fn(...args), args)) as T
}

export function loggedSyncFunction<T extends (...args: unknown[]) => unknown>(func: T, category: LogCategory, name: string): T {
  return ((...args: unknown[]) => {
    loggedFunctionExecution(category, name, () => func(...args), args).catch(() => {})
    return func(...args)
  }) as T
}
