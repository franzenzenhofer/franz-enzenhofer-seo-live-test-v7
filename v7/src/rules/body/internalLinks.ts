import type { Rule } from '@/core/types'
import { EVIDENCE_LIMIT } from '@/shared/domEvidence'
import {domPathField, textField, urlField} from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const EXCERPT_LIMIT = 100
const excerpt = (text: string) => text.slice(0, EXCERPT_LIMIT)
const resolvedHttpField = (key: string, raw: string, base: string) => {
  const trimmed = raw.trim()
  if (!trimmed) return textField(key, 'Not declared')
  try { return ['http:', 'https:'].includes(new URL(trimmed, base).protocol) ? urlField(key, trimmed) : textField(key, trimmed) } catch { return textField(key, trimmed) }
}

const sameHost = (base: string, href: string) => {
  try {
    const b = new URL(base)
    const u = new URL(href, base)
    return b.host === u.host
  } catch {
    return false
  }
}

export const internalLinksRule: Rule = {
  id: 'body:internal-links',
  name: 'Internal links count',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'franz',
    references: [
      'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
    ],
    description: 'Counts anchors with href, split into same-host (internal) vs cross-host (external), always reported as info.',
  },
  async run(page) {
    const anchors = page.doc.querySelectorAll<HTMLAnchorElement>('a[href]')
    const internalLinks: HTMLAnchorElement[] = []
    const externalLinks: HTMLAnchorElement[] = []
    let internalCount = 0
    let externalCount = 0

    for (let index = 0; index < anchors.length; index++) {
      const x = anchors.item(index)
      if (!x) continue
      if (sameHost(page.url, x.getAttribute('href') || '')) {
        internalCount++
        if (internalLinks.length < EVIDENCE_LIMIT) internalLinks.push(x)
      } else {
        externalCount++
        if (externalLinks.length < EVIDENCE_LIMIT) externalLinks.push(x)
      }
    }

    const sampled = [...internalLinks, ...externalLinks]
    const captured = markupEvidence(sampled, 'Link markup')
    return presentResult(internalLinksRule, page, {
      input: 'Static DOM + Page URL', type: 'info', priority: 750,
      values: [textField('Internal links', internalCount), textField('External links', externalCount)],
      detailValues: [textField('Internal examples retained', internalLinks.length), textField('Internal examples omitted', internalCount - internalLinks.length),
        textField('External examples retained', externalLinks.length), textField('External examples omitted', externalCount - externalLinks.length)],
      checked: [textField('Selector', 'a[href]'), textField('Classification', 'Same URL host is internal; every other result is external'),
        textField('Resolution', 'Anchor href resolved against the page URL'), textField('Criterion', 'Reports observed internal and external link counts')],
      evidence: sampled.map((link, index) => {
        const internal = index < internalLinks.length
        return {
          name: `${internal ? 'Internal' : 'External'} link ${internal ? index + 1 : index - internalLinks.length + 1}`,
          fields: [textField(`Link text (first ${EXCERPT_LIMIT} characters)`, excerpt((link.textContent || '').replace(/\s+/g, ' ').trim()) || 'Empty'),
            resolvedHttpField('Href', link.getAttribute('href') || '', page.url), textField('Category', internal ? 'Same host' : 'Cross host'),
            domPathField('DOM path', captured.selectors[index], 'Not captured')],
        }
      }),
      markup: captured.markup,
      noMarkup: sampled.length ? 'Complete original link markup not retained' : 'No a[href] elements found',
    })
  },
}
