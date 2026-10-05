import { chainDetailValues, chainEvidence, failureReason, soft404Verdict } from './soft404.evidence'

import { hasHeaders } from '@/shared/http-utils'
import { followRedirectChain } from '@/shared/redirectChain'
import { RedirectChainError } from '@/shared/redirectChainTypes'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const NAME = 'Soft 404 Probe'
const RULE_ID = 'http:soft-404'
const NO_MARKUP = 'None - this rule checks the HTTP response, not document markup'
const PROBE_INPUT = 'Page URL + Soft 404 probe HTTP response'

const buildProbeUrl = (rawUrl: string): string => {
  const u = new URL(rawUrl)
  u.search = ''
  u.hash = ''
  const basePath = u.pathname.replace(/\/[^/]*$/, '')
  const dir = basePath || '/'
  const slug = `fake-url-for-soft-404-error-check-${Math.floor(Math.random() * 100000000000)}`
  u.pathname = `${dir.replace(/\/$/, '')}/${slug}`
  return u.toString()
}

const checked = [
  textField('Probe target', 'Randomly generated non-existent URL in the page directory'),
  textField('Pass criterion', 'Direct HTTP 404 or 410, or any other 4xx except 429'),
  textField('Error criterion', 'HTTP 200, redirect loop or hop cap exceeded'),
  textField('Information criterion', 'HTTP 404 or 410 reached after a redirect'),
  textField('Inconclusive (warning)', 'HTTP 429, 5xx, unfollowable 3xx or no status'),
  textField('Redirect handling', 'Followed up to the configured hop cap'),
]

export const soft404Rule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/http-network-errors#soft-404-errors',
      'https://developers.google.com/search/docs/crawling-indexing/http-network-errors',
    ],
    description:
      "Probes a randomly generated non-existent URL in the page's directory and expects a direct HTTP 404 or 410. A 200 is reported as a soft 404; a rate limit, server error or unfollowable redirect is reported as inconclusive, never as a finding.",
  },
  async run(page, ctx) {
    if (!hasHeaders(page.headers)) {
      return presentResult(soft404Rule, page, {
        input: 'Not captured', type: 'runtime_error', priority: 50,
        values: [textField('Header capture', 'Not captured')],
        checked: [textField('Capture requirement', 'Main-document response headers must be captured before probing')],
        noMarkup: NO_MARKUP,
      })
    }
    let probeUrl: string
    try {
      probeUrl = buildProbeUrl(page.url)
    } catch {
      return presentResult(soft404Rule, page, {
        input: 'Page URL', type: 'runtime_error', priority: 10,
        values: [textField('Probe URL', 'Could not be built')],
        checked,
        noMarkup: NO_MARKUP,
      })
    }

    try {
      const { chain } = await followRedirectChain(probeUrl, { signal: ctx.signal })
      const verdict = soft404Verdict(chain)
      return presentResult(soft404Rule, page, {
        input: PROBE_INPUT, type: verdict.type, priority: verdict.priority,
        values: [
          urlField('Probed URL', probeUrl),
          textField('Final status', httpStatusLabel(chain.finalStatus > 0 ? chain.finalStatus : undefined)),
          textField('Classification', verdict.classification),
        ],
        detailValues: chainDetailValues(chain),
        // A runtime limitation is an explanation of what was checked, not an observed value (F10).
        checked: [...checked, ...(chain.note ? [textField('Runtime note', chain.note)] : [])],
        evidence: chainEvidence(chain.hops),
        noMarkup: NO_MARKUP,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const hops = error instanceof RedirectChainError ? error.hops : []
      return presentResult(soft404Rule, page, {
        input: hops.length ? PROBE_INPUT : 'Page URL', type: 'runtime_error', priority: 5,
        values: [urlField('Probed URL', probeUrl), textField('Request', 'Failed'), textField('Error', failureReason(message))],
        checked,
        evidence: chainEvidence(hops),
        noMarkup: NO_MARKUP,
      })
    }
  },
}
