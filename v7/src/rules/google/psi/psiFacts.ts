import { extractPSIKey } from '../google-utils'

import { textField, urlField } from '@/shared/presentation/create'
import { getPSIKey, runPSI, type PSIResult } from '@/shared/psi'
import type { Ctx, Result } from '@/core/types'
import type { Presentation } from '@/shared/presentation/schema'

export type PsiFacts = Pick<Presentation, 'input' | 'values' | 'checked'> & Partial<Presentation> & Pick<Result, 'type' | 'priority'>
export type PsiOutcome = { ok: true; json: PSIResult } | { ok: false; facts: PsiFacts }

const NOT_MARKUP = 'None - this rule checks the PageSpeed Insights API, not document markup'
const MAX_ERROR_LENGTH = 300
const boundedError = (message: string) => message.length > MAX_ERROR_LENGTH
  ? `${message.slice(0, MAX_ERROR_LENGTH)}... [truncated]`
  : message

/** Never let a fetch/parse failure throw out of a migrated rule; report it as a fact instead. */
export const requestPsi = async (url: string, strategy: 'mobile' | 'desktop', ctx: Ctx): Promise<PsiOutcome> => {
  const key = getPSIKey(extractPSIKey(ctx))
  try {
    return { ok: true, json: await runPSI(url, strategy, key) }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      facts: {
        input: 'Page URL',
        type: 'runtime_error',
        priority: -1000,
        values: [textField('PageSpeed Insights API response', 'Request failed')],
        detailValues: [textField('Error', boundedError(message)), urlField('Requested page URL', url), textField('Strategy', strategy)],
        checked: [textField('API', 'PageSpeed Insights v5 runPagespeed')],
        noMarkup: NOT_MARKUP,
      },
    }
  }
}

export const psiApi = (strategy: 'mobile' | 'desktop') => [
  textField('API', 'PageSpeed Insights v5 runPagespeed'),
  textField('Strategy', strategy),
]

export { NOT_MARKUP as PSI_NOT_MARKUP }
