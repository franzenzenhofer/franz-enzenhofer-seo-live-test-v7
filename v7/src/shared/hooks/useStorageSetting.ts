import { useState, useEffect } from 'react'

/**
 * Hook for managing a single chrome.storage.local value with real-time sync.
 *
 * This hook eliminates duplicate storage code by providing a unified interface
 * for reading and writing storage values with automatic real-time synchronization
 * across all contexts (settings page, sidepanel, etc.).
 *
 * @param key - Storage key (e.g., 'ui:autoRun')
 * @param defaultValue - Default value if key doesn't exist
 * @returns [value, setValue] - Current value and update function
 *
 * @example
 * ```typescript
 * // In any component (settings or sidepanel):
 * const [autoRun, setAutoRun] = useStorageSetting('ui:autoRun', true)
 *
 * // Changes sync automatically across all contexts!
 * ```
 */
export const useStorageSetting = <T>(
  key: string,
  defaultValue: T
): [T, (value: T) => Promise<void>] => {
  const [value, setValue] = useState<T>(defaultValue)

  // Load initial value from storage
  useEffect(() => {
    chrome.storage.local.get(key).then(result => {
      setValue(result[key] ?? defaultValue)
    }).catch(() => {
      // Silently fail and use default value
      setValue(defaultValue)
    })
  }, [key, defaultValue])

  // Real-time sync: Listen for changes from ANY context
  useEffect(() => {
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area === 'local' && changes[key]) {
        setValue(changes[key].newValue ?? defaultValue)
      }
    }

    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [key, defaultValue])

  // Update function: Sets value in storage AND local state
  const updateValue = async (newValue: T): Promise<void> => {
    await chrome.storage.local.set({ [key]: newValue })
    setValue(newValue)
  }

  return [value, updateValue]
}
