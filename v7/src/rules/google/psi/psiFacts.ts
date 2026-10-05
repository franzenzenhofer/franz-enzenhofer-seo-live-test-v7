import { requestFailedRows, urlOrText } from '../failureReason'
import { extractPSIKey } from '../google-utils'

import { textField } from '@/shared/presentation/create'
import { getPSIKey, runPSI, type PSIResult } from '@/shared/psi'
import type { Ctx, Result } from '@/core/types'
import type { Presentation } from '@/shared/presentation/schema'

export type PsiFacts = Pick<Presentation, 'input' | 'values' | 'checked'> & Partial<Presentation> & Pick<Result, 'type' | 'priority'>
export type PsiOutcome = { ok: true; json: PSIResult } | { ok: false; facts: PsiFacts }

const NOT_MARKUP = 'None - this rule checks the PageSpeed Insights API, not document markup'
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
        values: [...requestFailedRows(message), urlOrText('Requested URL', url)],
        checked: psiApi(strategy),
        noMarkup: NOT_MARKUP,
      },
    }
  }
}

export const psiApi = (strategy: 'mobile' | 'desktop') => [
  textField('API', 'PageSpeed Insights v5 runPagespeed'),
  textField('Strategy', strategy),
]

export const PSI_API_INPUT = 'Page URL + PageSpeed Insights API response'
export { NOT_MARKUP as PSI_NOT_MARKUP }
