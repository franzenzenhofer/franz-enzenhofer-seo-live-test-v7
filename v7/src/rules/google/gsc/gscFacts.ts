import { textField, urlField } from '@/shared/presentation/create'
import type { Presentation } from '@/shared/presentation/schema'
import type { Result } from '@/core/types'

export type GscFacts = Pick<Presentation, 'input' | 'values' | 'checked'> & Partial<Presentation> & Pick<Result, 'type' | 'priority'>

export const GSC_NOT_MARKUP = 'None - this rule checks the Search Console API, not document markup'

export const gscNoTokenFacts = (): GscFacts => ({
  input: 'Extension session state',
  type: 'runtime_error',
  priority: -1000,
  values: [textField('Google sign-in', 'Not signed in')],
  checked: [textField('Requires', 'A stored Google OAuth access token for the signed-in Google account')],
  noMarkup: GSC_NOT_MARKUP,
})

export const gscPropertyMissingFacts = (pageUrl: string): GscFacts => ({
  input: 'Page URL + Search Console API response',
  type: 'runtime_error',
  priority: -1000,
  values: [textField('Search Console property', 'Not confirmed for the signed-in account')],
  detailValues: [urlField('Checked page URL', pageUrl)],
  checked: [
    textField('Property scopes probed', 'URL-prefix property and sc-domain property for this hostname'),
    textField('Criterion', 'A Search Console property the signed-in account can query, covering this URL'),
  ],
  noMarkup: GSC_NOT_MARKUP,
})
