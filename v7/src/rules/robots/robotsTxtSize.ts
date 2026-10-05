import type { Rule } from '@/core/types'
import { fetchStatusTextOnce } from '@/shared/fetchOnce'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'robots.txt size'
const RULE_ID = 'robots:size'
const MAX_BYTES = 512000
const BYTES_PER_KIB = 1024
const TIMEOUT_MS = 1500
const NO_MARKUP = 'None - this rule checks robots.txt, not document markup'

const toKiB = (bytes: number) => Number((bytes / BYTES_PER_KIB).toFixed(1))
const LIMIT_KIB = toKiB(MAX_BYTES)

const checkedFacts = (criterion: string) => [
  textField('Fetch target', 'origin/robots.txt'),
  textField('Timeout', `${TIMEOUT_MS} ms`),
  textField('Limit', `${MAX_BYTES} bytes (${LIMIT_KIB} KiB)`),
  textField('Criterion', criterion),
]

export const robotsTxtSizeRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt',
      'https://www.rfc-editor.org/rfc/rfc9309.html#section-2.5',
    ],
    description: 'Measures robots.txt byte size and warns when it reaches the 512000 byte (500 KiB) limit Google reads; content past the limit is ignored by Google and not fetched here.',
  },
  async run(page, ctx) {
    let origin = ''
    try {
      const url = new URL(page.url)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return presentResult(robotsTxtSizeRule, page, {
          input: 'Page URL', type: 'info', priority: 900,
          values: [textField('robots.txt size', 'Not checked'), textField('Reason', `Skipped - ${url.protocol} URL`)],
          checked: checkedFacts('Page URL uses the http or https scheme'), noMarkup: NO_MARKUP,
        })
      }
      origin = url.origin
    } catch {
      return presentResult(robotsTxtSizeRule, page, {
        input: 'Page URL', type: 'info', priority: 900,
        values: [textField('robots.txt size', 'Not checked'), textField('Reason', 'Invalid page URL')],
        checked: checkedFacts('Page URL uses the http or https scheme'), noMarkup: NO_MARKUP,
      })
    }

    const robotsTxtUrl = `${origin}/robots.txt`
    const fetched = await fetchStatusTextOnce(robotsTxtUrl, TIMEOUT_MS, ctx.signal)
    const url = urlField('robots.txt URL', robotsTxtUrl)
    const criterion = checkedFacts('Bytes read at or above the 512000 byte limit Google reads')
    if (!fetched?.ok) {
      return presentResult(robotsTxtSizeRule, page, {
        input: fetched ? 'robots.txt response' : 'Not captured', type: 'info', priority: 850,
        values: [textField('robots.txt size', 'Not checked'),
          fetched ? textField('HTTP status', httpStatusLabel(fetched.status)) : textField('Response', 'Not captured'), url],
        checked: criterion, noMarkup: NO_MARKUP,
      })
    }

    // The shared probe stops at exactly the limit Google reads, so an oversize
    // file is known to be "at least" that big - its real size is not measured.
    const bytes = fetched.bytes
    const exceeds = fetched.truncated
    const sizeKiB = toKiB(bytes)

    return presentResult(robotsTxtSizeRule, page, {
      input: 'robots.txt response', type: exceeds ? 'warn' : 'info', priority: exceeds ? 220 : 820,
      values: [textField('robots.txt size', exceeds ? `${sizeKiB} KiB or more` : `${sizeKiB} KiB`),
        ...(exceeds ? [textField('Read limit', 'Reached')] : []), url],
      detailValues: [textField('HTTP status', httpStatusLabel(fetched.status)), textField('Bytes read', `${bytes} bytes`)],
      checked: criterion, noMarkup: NO_MARKUP,
    })
  },
}
