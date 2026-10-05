import { requestFailedRows, urlOrText } from '../failureReason'

import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import type { DisplayField, Presentation } from '@/shared/presentation/schema'
import type { Result } from '@/core/types'

export type GscFacts = Pick<Presentation, 'input' | 'values' | 'checked'> & Partial<Presentation> & Pick<Result, 'type' | 'priority'>

export const GSC_NOT_MARKUP = 'None - this rule checks the Search Console API, not document markup'
export const GSC_API_INPUT = 'Page URL + Search Console API response'
const SESSION_INPUT = 'Extension session state'

/** The property that answered: a link for a URL-prefix property, literal text for sc-domain. */
export const propertyFields = (property: string, propertyType: string): DisplayField[] =>
  [urlOrText('Property', property), textField('Property type', propertyType)]

export const gscNoTokenFacts = (): GscFacts => ({
  input: SESSION_INPUT,
  type: 'runtime_error',
  priority: -1000,
  values: [textField('Access token', 'Not found')],
  checked: [textField('Requires', 'A stored Google OAuth access token for the signed-in Google account')],
  noMarkup: GSC_NOT_MARKUP,
})

export const gscApiIssueFacts = (api: string, status: number, property: string, propertyType: string): GscFacts => ({
  input: GSC_API_INPUT,
  type: 'runtime_error',
  priority: -1000,
  values: [textField('GSC response', httpStatusLabel(status))],
  detailValues: propertyFields(property, propertyType),
  checked: [textField('API', api)],
  noMarkup: GSC_NOT_MARKUP,
})

export const gscNetworkErrorFacts = (api: string, message: string, property?: string, propertyType?: string): GscFacts => ({
  input: 'Page URL',
  type: 'runtime_error',
  priority: -1000,
  values: requestFailedRows(message),
  detailValues: property && propertyType ? propertyFields(property, propertyType) : [],
  checked: [textField('API', api)],
  noMarkup: GSC_NOT_MARKUP,
})

export const gscPropertyMissingFacts = (pageUrl: string): GscFacts => ({
  input: GSC_API_INPUT,
  type: 'runtime_error',
  priority: -1000,
  values: [textField('GSC property', 'Not found')],
  detailValues: [urlField('Current page URL', pageUrl)],
  checked: [
    textField('Property scopes probed', 'URL-prefix property and sc-domain property for this hostname'),
    textField('Criterion', 'A Search Console property the signed-in account can query, covering this URL'),
  ],
  noMarkup: GSC_NOT_MARKUP,
})
