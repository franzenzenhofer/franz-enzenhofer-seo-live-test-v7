import type { Rule } from '@/core/types'

export const googleIsConnectedRule: Rule = {
  id: 'google:is-connected',
  name: 'Google auth connected',
  enabled: true,
  what: 'static',
  async run(_page, ctx) {
    const token = (ctx.globals as { googleApiAccessToken?: string | null }).googleApiAccessToken || null
    return token
      ? { label: 'GOOGLE', message: 'Google token present', type: 'ok', name: 'isConnected' }
      : { label: 'GOOGLE', message: 'No Google token', type: 'info', name: 'isConnected' }
  },
}

