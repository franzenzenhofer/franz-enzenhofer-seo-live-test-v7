import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'HTTP'
const NAME = 'Soft 404 Probe'
const RULE_ID = 'http:soft-404'
const SPEC = 'https://support.google.com/webmasters/answer/181708?hl=en'

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

export const soft404Rule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    let probeUrl: string
    try {
      probeUrl = buildProbeUrl(page.url)
    } catch {
      return {
        label: LABEL,
        name: NAME,
        message: 'Cannot build probe URL for soft 404 check.',
        type: 'runtime_error',
        priority: 10,
        details: { url: page.url, reference: SPEC },
      }
    }

    try {
      const res = await fetch(probeUrl, { redirect: 'follow' })
      const status = res.status
      const finalUrl = res.url || probeUrl
      const redirected = res.redirected
      const snippet = extractSnippet(`${status} ${finalUrl}`, 200)

      if (status === 404 && !redirected) {
        return {
          label: LABEL,
          name: NAME,
          message: `Non-existing URL returned HTTP 404 (expected).`,
          type: 'ok',
          priority: 900,
          details: { probeUrl, finalUrl, status, redirected, snippet, reference: SPEC },
        }
      }

      if (status === 410) {
        return {
          label: LABEL,
          name: NAME,
          message: `Non-existing URL returned HTTP 410 (should be 404).`,
          type: 'warn',
          priority: 150,
          details: { probeUrl, finalUrl, status, redirected, snippet, reference: SPEC },
        }
      }

      if (status === 200) {
        return {
          label: LABEL,
          name: NAME,
          message: `Soft 404: Non-existing URL returned HTTP 200${redirected ? ' after redirect(s)' : ''} (should be 404).`,
          type: 'error',
          priority: 50,
          details: { probeUrl, finalUrl, status, redirected, snippet, reference: SPEC },
        }
      }

      if (status === 404 && redirected) {
        return {
          label: LABEL,
          name: NAME,
          message: `Non-existing URL returned HTTP 404 after redirect(s) (should be direct 404).`,
          type: 'error',
          priority: 100,
          details: { probeUrl, finalUrl, status, redirected, snippet, reference: SPEC },
        }
      }

      return {
        label: LABEL,
        name: NAME,
        message: `Soft 404: Non-existing URL returned HTTP ${status}${redirected ? ' after redirect(s)' : ''} (should be 404).`,
        type: status >= 500 ? 'error' : 'error',
        priority: 120,
        details: { probeUrl, finalUrl, status, redirected, snippet, reference: SPEC },
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        label: LABEL,
        name: NAME,
        message: `Soft 404 probe failed: ${message}`,
        type: 'runtime_error',
        priority: 5,
        details: { url: page.url, reference: SPEC },
      }
    }
  },
}
