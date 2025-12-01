// Moved to trash on 2025-11-26: unused error handling helpers not referenced in runtime.
/**
 * Error handling utilities
 * Replaces empty catch blocks with proper error logging
 */

export const logAndIgnore = (context: string) => (error: unknown): void => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.warn(`[${context}] Error occurred but continuing:`, errorMessage)
}

export const logError = (context: string) => (error: unknown): void => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(`[${context}] Error:`, errorMessage)
}

export const silentIgnore = (): void => {
  // Intentionally empty - use only when error is truly expected and ignorable
  // Prefer logAndIgnore for better debugging
}
