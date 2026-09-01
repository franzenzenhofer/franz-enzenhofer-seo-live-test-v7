import type { Rule } from '@/core/types'

const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics'

export const clientSideRenderingRule: Rule = {
  id: 'dom:client-side-rendering',
  name: 'Client-side rendering heuristic',
  enabled: true,
  what: 'static',
  async run(page) {
    const staticFacts = page.staticFacts
    const idleFacts = page.idleFacts
    if (!staticFacts || !idleFacts) {
      return {
        label: 'DOM', name: 'Client-side rendering heuristic', type: 'runtime_error', priority: 900,
        message: 'Static and idle DOM facts are required for client-side rendering analysis.',
        details: { staticAvailable: !!staticFacts, idleAvailable: !!idleFacts, reference: SPEC },
      }
    }
    const addedText = Math.max(0, idleFacts.textLength - staticFacts.textLength)
    const hydrated = addedText >= 40 && idleFacts.textLength >= staticFacts.textLength * 1.25
    const scriptHeavy = staticFacts.scriptCount > 5 || staticFacts.blockingScriptCount > 0
    const possible = hydrated || (staticFacts.textLength < 40 && scriptHeavy)
    return {
      label: 'DOM', name: 'Client-side rendering heuristic', type: 'info',
      priority: possible ? 500 : 850,
      message: possible
        ? `Client rendering changed visible text by ${addedText} characters between static and idle phases.`
        : 'No material client-rendered text change detected between static and idle phases.',
      details: {
        staticTextLength: staticFacts.textLength,
        idleTextLength: idleFacts.textLength,
        addedText,
        staticScriptCount: staticFacts.scriptCount,
        staticBlockingScriptCount: staticFacts.blockingScriptCount,
        hydrated,
        reference: SPEC,
      },
    }
  },
}
