import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Google sign-in credentials'

export const googleIsConnectedRule: Rule = {
  id: 'google:is-connected',
  name: NAME,
  presentation: 1,
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
  async run(page, ctx) {
    const token = (ctx.globals as { googleApiAccessToken?: string | null }).googleApiAccessToken || null
    return presentResult(googleIsConnectedRule, page, {
      input: 'Extension session state',
      type: token ? 'ok' : 'info',
      priority: token ? 850 : 900,
      values: [textField('Access token', token ? 'Found' : 'Not found')],
      checked: [
        textField('Checked', 'Presence of a Google OAuth access token in the extension session'),
        textField('Not checked', 'Token expiry and access to a particular Search Console property'),
      ],
      noMarkup: 'None - this rule checks extension session state, not document markup',
    })
  },
}
