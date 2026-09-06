import type { Rule } from '@/core/types'

export const clientSideRenderingRule: Rule = {
  id: 'dom:client-side-rendering',
  name: 'Client-side rendering heuristic',
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
    if (!staticFacts || !idleFacts) {
      return {
        label: 'DOM', name: 'Client-side rendering heuristic', type: 'runtime_error', priority: 900,
        message: 'Static and idle DOM facts are required for client-side rendering analysis.',
        details: { staticAvailable: !!staticFacts, idleAvailable: !!idleFacts },
      }
    }
    const addedText = Math.max(0, idleFacts.textLength - staticFacts.textLength)
    const removedText = Math.max(0, staticFacts.textLength - idleFacts.textLength)
    const contentChanged = staticFacts.content && idleFacts.content
      ? staticFacts.content.fingerprint !== idleFacts.content.fingerprint : undefined
    const hydrated = addedText >= 40 && idleFacts.textLength >= staticFacts.textLength * 1.25
    const scriptHeavy = staticFacts.scriptCount > 5 || staticFacts.blockingScriptCount > 0
    const possible = hydrated || removedText > 0 || contentChanged || (staticFacts.textLength < 40 && scriptHeavy)
    return {
      label: 'DOM', name: 'Client-side rendering heuristic', type: 'info',
      priority: possible ? 500 : 850,
      message: possible
        ? `Content differs between document_end and document_idle: ${addedText} characters added, ${removedText} removed (net length changes).`
        : 'No material content-text growth detected between document_end and document_idle; this is not a JavaScript-disabled test.',
      details: {
        staticTextLength: staticFacts.textLength,
        idleTextLength: idleFacts.textLength,
        addedText,
        removedText,
        contentChanged,
        staticContent: staticFacts.content,
        idleContent: idleFacts.content,
        growthThreshold: { minimumCharacters: 40, minimumRatio: 1.25 },
        tested: 'Normalized content lengths and order-sensitive text fingerprints from JavaScript-enabled lifecycle observations; CSS visibility is not established.',
        staticScriptCount: staticFacts.scriptCount,
        staticBlockingScriptCount: staticFacts.blockingScriptCount,
        hydrated,
      },
    }
  },
}
