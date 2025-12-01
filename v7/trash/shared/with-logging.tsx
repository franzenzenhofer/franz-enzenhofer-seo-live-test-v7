// Moved to trash on 2025-11-26: unused React logging HOC and hook.
/**
 * React Higher-Order Component for Automatic Component Logging
 */

import React, { useEffect, useRef } from 'react'

import { Logger } from './logger.js'

/**
 * HOC that automatically logs component lifecycle events
 * Usage: export default withLogging(MyComponent, 'MyComponent')
 */
export function withLogging<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return (props: P) => {
    const renderCount = useRef(0)
    const mountTime = useRef(performance.now())

    // Log mount
    useEffect(() => {
      const duration = (performance.now() - mountTime.current).toFixed(2)

      Logger.log('ui', `${componentName} mount`, {
        duration: `${duration}ms`,
        props: Object.keys(props).length,
      }).catch(() => {
        // Ignore logging errors
      })

      // Log unmount
      return () => {
        Logger.log('ui', `${componentName} unmount`, {
          renders: renderCount.current,
        }).catch(() => {
          // Ignore logging errors
        })
      }
    }, [])

    // Log renders
    useEffect(() => {
      renderCount.current++

      if (renderCount.current > 1) {
        Logger.logSync('ui', `${componentName} render`, {
          count: renderCount.current,
          props: Object.keys(props).length,
        })
      }
    })

    return <Component {...props} />
  }
}

/**
 * Hook to log user interactions
 */
export function useLoggedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  action: string,
  additionalData?: Record<string, unknown>
): T {
  return ((...args: unknown[]) => {
    Logger.logSync('ui', action, additionalData)
    return callback(...args)
  }) as T
}
