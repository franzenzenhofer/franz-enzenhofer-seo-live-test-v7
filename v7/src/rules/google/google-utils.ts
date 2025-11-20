/**
 * Google API utilities
 * Eliminates EXACT duplication in 9 Google API rule files
 */

import type { Ctx } from '@/core/types'

const OAUTH_SPEC = 'https://developers.google.com/identity/protocols/oauth2'
const PSI_SPEC = 'https://developers.google.com/speed/docs/insights/v5/get-started'
const NO_TOKEN_TESTED = 'Checked session globals for googleApiAccessToken before invoking Google APIs.'
const PSI_KEY_TESTED = 'Checked globals.variables.google_page_speed_insights_key before sending PSI request.'

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
    details: { tested: NO_TOKEN_TESTED, reference: OAUTH_SPEC },
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
    details: { tested: PSI_KEY_TESTED, reference: PSI_SPEC },
  }
}
