import type { Rule } from '@/core/types'

export const googleIsConnectedRule: Rule = {
  id: 'google:is-connected',
  name: 'Google auth connected',
  enabled: true,
  what: 'static',
  async run(_page, ctx) {
    const token = (ctx.globals as { googleApiAccessToken?: string | null }).googleApiAccessToken || null
    const tested = 'Checked chrome session globals for googleApiAccessToken to confirm OAuth session status.'
    const reference = 'https://developers.google.com/identity/protocols/oauth2'

    return token
      ? {
          label: 'GOOGLE',
          message: 'Google token present',
          type: 'ok',
          name: 'Google auth connected',
          details: { tested, tokenPresent: true, reference },
        }
      : {
          label: 'GOOGLE',
          message: 'No Google token',
          type: 'info',
          name: 'Google auth connected',
          details: { tested, tokenPresent: false, reference },
        }
  },
}
