import type { Rule } from '@/core/types'

export const seoPhaseChangesRule: Rule = {
  id: 'dom:seo-phase-changes', name: 'SEO elements across DOM phases', enabled: true, what: 'static',
  meta: { provenance: 'google', references: ['https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics'],
    description: 'Compares all captured SEO element fingerprints at document_end and document_idle without transporting full HTML.' },
  async run(page) {
    const before = page.staticFacts?.seoSignals, after = page.idleFacts?.seoSignals
    const base = { label: 'DOM', name: 'SEO elements across DOM phases', priority: 750 } as const
    if (!before || !after) return { ...base, type: 'info', message: 'SEO phase comparison unavailable: both lifecycle observations are required.' }
    const changed = Object.keys(before).filter((key) => before[key]?.fingerprint !== after[key]?.fingerprint || before[key]?.count !== after[key]?.count)
    return { ...base, type: 'info', message: changed.length ? `SEO elements changed between document_end and document_idle: ${changed.join(', ')}.` : 'SEO element fingerprints unchanged between document_end and document_idle.',
      details: { changed, documentEnd: before, documentIdle: after,
        tested: 'Every matching element contributes to order-sensitive fingerprints; a change may reflect values, order or count. These phases are not source HTML or JavaScript-disabled rendering.' } }
  },
}
