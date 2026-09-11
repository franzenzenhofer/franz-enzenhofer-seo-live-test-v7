import type { Rule } from '@/core/types'
import { httpResponseInput, navigationResponseNote, responseSourceFact } from '@/shared/httpResponseInput'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

export const httpStatusRule: Rule = {
  id: 'http-status', name: 'HTTP response status', presentation: 1, enabled: true, what: 'http',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/crawling/docs/troubleshooting/http-status-codes', 'https://www.iana.org/assignments/http-status-codes'],
    description: 'Reports the captured status code of the page URL and its standard name, naming whether it is the navigation response or a separate HEAD probe.',
  },
  async run(page, ctx) {
    const status = page.status
    const captured = !!status && status >= 100 && status <= 599 && Number.isInteger(status)
    const headers = Object.entries(page.headers || {})
    const softNavigation = navigationResponseNote(ctx.globals)
    return presentResult(httpStatusRule, page, {
      input: (captured && httpResponseInput(page)) || 'Not captured',
      type: !captured ? 'runtime_error' : status >= 400 ? 'error' : status >= 200 && status < 300 ? 'ok' : 'info',
      priority: !captured ? 100 : status >= 400 ? 50 : 800,
      values: [
        textField('Response status', captured ? httpStatusLabel(status) : 'Valid HTTP status not captured'),
        ...(softNavigation ? [textField('Navigation', softNavigation)] : []),
      ],
      detailValues: [urlField('Page URL', page.url), textField('Response source', captured ? responseSourceFact(page) : 'Not captured'),
        textField('Response headers', page.headers ? `${headers.length} captured fields` : 'Not captured')],
      checked: [textField('Response', 'Main-document navigation response, else a separate HEAD probe of the page URL'),
        textField('Capture validity', 'Integer status code from 100 to 599'),
        textField('Classification', '200–299: passed; 400–599: failed; other captured codes: observation')],
      evidence: captured && headers.length ? [{ name: 'Captured response headers', fields: headers.map(([key, value]) => textField(key, value)) }] : [],
      noMarkup: 'None — this rule checks the HTTP response, not document markup',
    })
  },
}
