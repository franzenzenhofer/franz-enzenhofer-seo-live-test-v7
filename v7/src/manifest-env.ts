import { OAUTH_CLIENT_ID } from '../config.js'

export const detectLegacyClientId = (): string => {
  // Check for environment variable override (used in CI/CD)
  const env = process.env['GOOGLE_OAUTH_CLIENT_ID'] || process.env['GOOGLE_APP_CLIENT_ID']
  if (env?.trim()) return env.trim()

  // Use SINGLE SOURCE OF TRUTH from config.js
  return OAUTH_CLIENT_ID
}
