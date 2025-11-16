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

export const createNoTokenResult = (label = 'GSC', name = 'googleRule') => {
  return {
    label,
    message: 'Google Search Console not authenticated. Sign in with Google in settings.',
    type: 'runtime_error' as const,
    name,
    priority: -1000,
  }
}

export const extractPSIKey = (ctx: Ctx): string | null => {
  const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
  const key = String(vars['google_page_speed_insights_key'] || '')
  return key || null
}

export const createPSIKeyMissingResult = () => {
  return {
    label: 'PSI',
    message: 'PageSpeed Insights API key not configured. Set google_page_speed_insights_key in settings.',
    type: 'runtime_error' as const,
    name: 'googleRule',
    priority: -1000,
  }
}
