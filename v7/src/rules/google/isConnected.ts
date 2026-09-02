import type { Rule } from '@/core/types'

export const googleIsConnectedRule: Rule = {
  id: 'google:is-connected',
  name: 'Google auth connected',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'franz',
    references: [],
    description: 'Reports whether a Google OAuth access token is present in the extension session (gates the GSC/PSI rule family).',
  },
  async run(_page, ctx) {
    const token = (ctx.globals as { googleApiAccessToken?: string | null }).googleApiAccessToken || null
    const tested = 'Checked chrome session globals for googleApiAccessToken to confirm OAuth session status.'

    return token
      ? {
          label: 'GOOGLE',
          message: 'Google token present',
          type: 'ok',
          priority: 850,
          name: 'Google auth connected',
          details: { tested, tokenPresent: true },
        }
      : {
          label: 'GOOGLE',
          message: 'No Google token',
          type: 'info',
          priority: 900,
          name: 'Google auth connected',
          details: { tested, tokenPresent: false },
        }
  },
}
