import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import type { Presentation } from '@/shared/presentation/schema'
import type { Result } from '@/core/types'

export type GscFacts = Pick<Presentation, 'input' | 'values' | 'checked'> & Partial<Presentation> & Pick<Result, 'type' | 'priority'>

export const GSC_NOT_MARKUP = 'None - this rule checks the Search Console API, not document markup'
const MAX_ERROR_LENGTH = 300
const boundedError = (message: string) => (message.length > MAX_ERROR_LENGTH ? `${message.slice(0, MAX_ERROR_LENGTH)}... [truncated]` : message)

export const gscNoTokenFacts = (): GscFacts => ({
  input: 'Extension session state',
  type: 'runtime_error',
  priority: -1000,
  values: [textField('Google sign-in', 'Not signed in')],
  checked: [textField('Requires', 'A stored Google OAuth access token for the signed-in Google account')],
  noMarkup: GSC_NOT_MARKUP,
})

export const gscApiIssueFacts = (api: string, status: number, property: string, propertyType: string): GscFacts => ({
  input: 'Page URL + Search Console API response',
  type: 'runtime_error',
  priority: -1000,
  values: [textField('Search Console API response', httpStatusLabel(status))],
  detailValues: [textField('Property', property), textField('Property type', propertyType)],
  checked: [textField('API', api)],
  noMarkup: GSC_NOT_MARKUP,
})

export const gscNetworkErrorFacts = (api: string, message: string, property?: string, propertyType?: string): GscFacts => ({
  input: 'Page URL',
  type: 'runtime_error',
  priority: -1000,
  values: [textField('Search Console API response', 'Request failed')],
  detailValues: [
    textField('Error', boundedError(message)),
    ...(property ? [textField('Property', property)] : []),
    ...(propertyType ? [textField('Property type', propertyType)] : []),
  ],
  checked: [textField('API', api)],
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
