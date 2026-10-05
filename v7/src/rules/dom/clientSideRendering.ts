import { PHASE_FACTS_MISSING_INPUT, phaseFactsMissingRow } from './phaseFactsMissing'

import type { Rule } from '@/core/types'
import type { DomPhaseFacts } from '@/shared/domFacts.types'
import { textField } from '@/shared/presentation/create'
import { clip } from '@/shared/presentation/listRow'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Client-side rendering heuristic'
const DETAIL_VALUE_LIMIT = 120

// The facts of one lifecycle phase as detail rows, prefixed by the phase so both sides read side by side.
const phaseRows = (phase: 'Static' | 'Idle', facts: DomPhaseFacts) => [
  textField(`${phase} characters`, facts.textLength), textField(`${phase} scripts`, facts.scriptCount),
  textField(`${phase} blocking scripts`, facts.blockingScriptCount),
  ...(facts.content ? [textField(`${phase} fingerprint`, facts.content.fingerprint), textField(`${phase} excerpt`, clip(facts.content.excerpt || 'Empty', DETAIL_VALUE_LIMIT))] : []),
]
const met = (value: boolean) => value ? 'Met' : 'Unmet'

export const clientSideRenderingRule: Rule = {
  id: 'dom:client-side-rendering',
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics'],
    description: 'Compares content summaries at document_end and document_idle. These are JavaScript-enabled lifecycle observations, not source HTML or a JavaScript-disabled test.',
  },
  async run(page) {
    const staticFacts = page.staticFacts
    const idleFacts = page.idleFacts
    const checked = [textField('Comparison', 'Normalized content-text length and order-sensitive fingerprint between document_end and document_idle')]
    if (!staticFacts || !idleFacts) {
      return presentResult(clientSideRenderingRule, page, {
        input: PHASE_FACTS_MISSING_INPUT, type: 'runtime_error', priority: 900,
        values: [phaseFactsMissingRow(staticFacts, idleFacts)],
        checked: [...checked, textField('Requirement', 'Both static and idle DOM facts must be captured for this comparison')],
        noMarkup: 'None - static and idle DOM facts are required for this comparison',
      })
    }
    const addedText = Math.max(0, idleFacts.textLength - staticFacts.textLength)
    const removedText = Math.max(0, staticFacts.textLength - idleFacts.textLength)
    const contentChanged = staticFacts.content && idleFacts.content
      ? staticFacts.content.fingerprint !== idleFacts.content.fingerprint : undefined
    const hydrated = addedText >= 40 && idleFacts.textLength >= staticFacts.textLength * 1.25
    const scriptHeavy = staticFacts.scriptCount > 5 || staticFacts.blockingScriptCount > 0
    const possible = hydrated || removedText > 0 || contentChanged || (staticFacts.textLength < 40 && scriptHeavy)

    return presentResult(clientSideRenderingRule, page, {
      input: 'Static DOM + Idle DOM', type: 'info', priority: possible ? 500 : 850,
      // Observed differences first, the heuristic verdict last (FORMATTING.md F1).
      values: [textField('Characters added', addedText), textField('Characters removed', removedText),
        textField('Fingerprint', contentChanged === undefined ? 'Not checked' : contentChanged ? 'Changed' : 'Unchanged'),
        textField('Rendering signals', possible ? 'Found' : 'Not found')],
      detailValues: [textField('Hydration criterion', met(hydrated)),
        textField('Script-heavy criterion', met(staticFacts.textLength < 40 && scriptHeavy)),
        ...phaseRows('Static', staticFacts), ...phaseRows('Idle', idleFacts)],
      checked: [...checked,
        textField('Hydration criterion', 'Added text >= 40 characters and idle length >= 1.25x static length'),
        textField('Script-heavy criterion', 'Static script count > 5 or blocking script count > 0, combined with static text length < 40 characters'),
        textField('Criterion', 'Met when the hydration criterion is met, text was removed, the content fingerprint changed, or the script-heavy criterion is met'),
        textField('Scope', 'JavaScript-enabled lifecycle observations; not a source-HTML or JavaScript-disabled comparison')],
      noMarkup: 'None - this rule compares text-length and fingerprint facts across DOM phases, not element markup',
    })
  },
}
