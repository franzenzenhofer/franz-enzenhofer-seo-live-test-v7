import type { Rule } from '@/core/types'

export const googleIsConnectedRule: Rule = {
  id: 'google:is-connected',
  name: 'Google sign-in credentials',
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "Checks whether the extension has saved Google sign-in credentials. This is an account setup check, not a website SEO issue.",
      action: "Open Settings > Google Account > Sign In. If Google rejects saved credentials, use Clear Token and sign in again.",
    },
    provenance: 'franz',
    references: [],
    description: 'Reports whether a Google OAuth access token is present in the extension session (enables authenticated GSC requests; PSI uses its own API key).',
  },
  async run(_page, ctx) {
    const token = (ctx.globals as { googleApiAccessToken?: string | null }).googleApiAccessToken || null
    const tested = 'Checks only whether sign-in credentials are stored; expiry and access to a particular Search Console property are not verified here.'

    return token
      ? {
          label: 'GOOGLE',
          message: 'Google sign-in credentials are stored. API access is checked separately.',
          type: 'ok',
          priority: 850,
          name: 'Google sign-in credentials',
          details: { tested, tokenPresent: true },
        }
      : {
          label: 'GOOGLE',
          message: 'Sign in to run Search Console checks.',
          type: 'info',
          priority: 900,
          name: 'Google sign-in credentials',
          details: { tested, tokenPresent: false, nextStep: 'Open Settings > Google Account > Sign In, then rerun the page test. Use an account with access to this site in Search Console.' },
        }
  },
}
