import type { Page, Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Meta Charset'
const RULE_ID = 'head:meta-charset'
const SELECTOR = 'head > meta[charset]'
const HTTP_EQUIV_SELECTOR = 'head > meta[http-equiv="content-type" i][content]'

const charsetFromContentType = (value: string): string => {
  const match = /charset\s*=\s*"?([^";\s]+)/i.exec(value)
  return (match?.[1] || '').trim().toUpperCase()
}

type Declaration = { charset: string; source: 'meta-charset' | 'http-equiv' | 'header'; element: Element | null }
const SOURCE_LABEL: Record<Declaration['source'], string> = { 'meta-charset': '<meta charset>', 'http-equiv': 'Meta http-equiv Content-Type', header: 'Content-Type header' }

const findDeclaration = (page: Pick<Page, 'doc' | 'headers'>): Declaration | null => {
  const metaEl = page.doc.querySelector(SELECTOR)
  if (metaEl) return { charset: (metaEl.getAttribute('charset') || '').trim().toUpperCase(), source: 'meta-charset', element: metaEl }
  const httpEquivEl = page.doc.querySelector(HTTP_EQUIV_SELECTOR)
  const httpEquivCharset = charsetFromContentType(httpEquivEl?.getAttribute('content') || '')
  if (httpEquivEl && httpEquivCharset) return { charset: httpEquivCharset, source: 'http-equiv', element: httpEquivEl }
  const headerCharset = charsetFromContentType(page.headers?.['content-type'] || '')
  return headerCharset ? { charset: headerCharset, source: 'header', element: null } : null
}

const checked = [
  textField('Meta selector', SELECTOR),
  textField('HTTP-equiv selector', HTTP_EQUIV_SELECTOR),
  textField('Precedence', 'Meta charset, http-equiv Content-Type, then Content-Type header'),
  textField('Criterion', 'Character encoding declaration is UTF-8'),
]

// Overview: the declared charset, where it was declared, then the complete declaring element (FORMATTING.md F1, F4).
export const metaCharsetRule: Rule = {
  id: RULE_ID, name: NAME, presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'standard', references: ['https://html.spec.whatwg.org/multipage/semantics.html#attr-meta-charset'],
    description: 'Checks the character encoding declaration (meta charset, meta http-equiv Content-Type, or Content-Type header): warn when absent or empty, ok for UTF-8, warn for any other value (WHATWG requires utf-8).',
  },
  async run(page) {
    const declaration = findDeclaration(page)
    const charset = declaration?.charset || ''
    const isUTF8 = charset === 'UTF-8'
    const priority = !declaration ? 100 : !charset ? 150 : isUTF8 ? 800 : 200
    const element = declaration?.element || page.doc.querySelector(HTTP_EQUIV_SELECTOR)
    const records = elementRecords(element ? [element] : [], element ? 1 : 0)
    const headerChecked = !declaration?.element && page.headers !== undefined
    const header = page.headers?.['content-type'] || ''
    return presentResult(metaCharsetRule, page, {
      input: headerChecked ? 'Static DOM + HTTP response headers' : 'Static DOM', type: isUTF8 ? 'ok' : 'warn', priority,
      values: [textField('Charset', charset || (declaration ? 'Empty' : 'Not declared')),
        ...(declaration ? [textField('Declaration source', SOURCE_LABEL[declaration.source])] : []), ...records.markup],
      detailValues: [...(headerChecked ? [textField('Content-Type header', header || 'Absent')] : []), ...(element ? records.counts : [])],
      checked: [...checked, textField('Header lookup', declaration?.element ? 'Not needed; meta declaration selected'
        : page.headers === undefined ? 'Not captured' : 'Content-Type'), textField('Normalization', 'Trimmed and uppercased')],
      evidence: records.evidence, markup: records.markup,
      noMarkup: element ? 'Complete original character encoding markup not retained' : declaration?.source === 'header' ? 'No character encoding element; declaration came from Content-Type header' : 'No character encoding element found',
    })
  },
}
