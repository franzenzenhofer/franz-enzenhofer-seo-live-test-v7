import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Client-side rendering heuristic'

const phaseFields = (facts: { textLength: number; scriptCount: number; blockingScriptCount: number; content?: { fingerprint: string; excerpt: string } }) => [
  textField('Text length', facts.textLength), textField('Script count', facts.scriptCount), textField('Blocking script count', facts.blockingScriptCount),
  ...(facts.content ? [textField('Content fingerprint', facts.content.fingerprint), textField('Content excerpt (first 160 characters)', facts.content.excerpt || 'Empty')] : []),
]

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
        input: [staticFacts && 'Static DOM', idleFacts && 'Idle DOM'].filter(Boolean).join(' + ') || 'Not captured',
        type: 'runtime_error', priority: 900,
        values: [textField('Static DOM facts', staticFacts ? 'Captured' : 'Not captured'), textField('Idle DOM facts', idleFacts ? 'Captured' : 'Not captured')],
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
      values: [textField('Client-side rendering heuristic', possible ? 'Met' : 'Not met'),
        textField('Text added (characters)', addedText), textField('Text removed (characters)', removedText)],
      detailValues: [textField('Content fingerprint changed', contentChanged === undefined ? 'Not compared' : contentChanged ? 'Yes' : 'No'),
        textField('Hydration heuristic met', hydrated ? 'Yes' : 'No')],
      checked: [...checked,
        textField('Hydration criterion', 'Added text >= 40 characters and idle length >= 1.25x static length'),
        textField('Script-heavy criterion', 'Static script count > 5 or blocking script count > 0, combined with static text length < 40 characters'),
        textField('Criterion', 'Met when the hydration criterion is met, text was removed, the content fingerprint changed, or the script-heavy criterion is met'),
        textField('Scope', 'JavaScript-enabled lifecycle observations; not a source-HTML or JavaScript-disabled comparison')],
      evidence: [{ name: 'Static DOM phase (document_end)', fields: phaseFields(staticFacts) }, { name: 'Idle DOM phase (document_idle)', fields: phaseFields(idleFacts) }],
      noMarkup: 'None - this rule compares text-length and fingerprint facts across DOM phases, not element markup',
    })
  },
}
