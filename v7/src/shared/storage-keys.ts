/**
 * Centralized storage keys for chrome.storage.local
 * Prevents typos and provides type safety
 */

export const STORAGE_KEYS = {
  UI: {
    AUTO_RUN: 'ui:autoRun',
    AUTO_CLEAR: 'ui:autoClear',
    DEBUG: 'ui:debug',
  },
  RULES: {
    FLAGS: 'rule-flags',
    VARIABLES: 'globalRuleVariables',
  },
  AUTH: {
    GOOGLE_TOKEN: 'googleApiAccessToken',
  },
  SETTINGS: {
    FAVORITES: 'favorites',
    DISABLED_RULES: 'disabledRules',
  },
} as const

// Type-safe helper type for all storage keys
export type StorageKeyPath = typeof STORAGE_KEYS
export type StorageKeyCategory = keyof StorageKeyPath
export type StorageKey = StorageKeyPath[StorageKeyCategory][keyof StorageKeyPath[StorageKeyCategory]]
