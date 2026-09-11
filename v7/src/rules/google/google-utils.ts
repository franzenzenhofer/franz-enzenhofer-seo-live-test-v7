/**
 * Google API utilities
 * Eliminates EXACT duplication in 9 Google API rule files
 */

import type { Ctx } from '@/core/types'

export interface GoogleCredentials {
  token: string | null
  vars: Record<string, unknown>
}

export const extractGoogleCredentials = (ctx: Ctx): GoogleCredentials => {
  const token = (ctx.globals as { googleApiAccessToken?: string | null }).googleApiAccessToken || null
  const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
  return { token, vars }
}

export const extractPSIKey = (ctx: Ctx): string | null => {
  const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
  const key = String(vars['google_page_speed_insights_key'] || '')
  return key || null
}
