import type { Rule } from '@/core/types'
import { httpStatusLabel } from '@/shared/httpStatusLabel'

const interpretation = (status: number): string => {
  if (status === 304) return 'The server says the cached response is still current. This is cache revalidation, not a redirect to another page.'
  if (status === 204) return 'The server returned no content. A successful status alone does not mean a usable or indexable page was delivered.'
  if (status < 200) return 'This is an interim response. The final response was not established by this status.'
  if (status < 300) return 'The request received a successful response. This does not prove that the content is correct or that Google has indexed it.'
  if (status < 400) return 'This response requires further action. Use the navigation journey to see the destination and its final response.'
  if (status === 404 || status === 410) return 'The requested page was not found or has been removed. This can be the correct response for content that no longer exists.'
  if (status === 401 || status === 403) return 'Access was denied or requires authentication. Check whether this URL is intended to be public.'
  if (status === 429) return 'The server is limiting requests. This audit may have received a different response from an ordinary visitor.'
  return status < 500 ? 'The server could not fulfill this request.' : 'The server or an upstream service failed to complete the request.'
}
const nextStep = (status: number): string => status === 404 || status === 410
  ? 'If the page should exist, restore it or fix links to this URL. If it moved, redirect to a relevant replacement. Keep the removal status when deletion is intentional.'
  : status === 401 || status === 403 ? 'If this page should be public, review access rules in the application, server and CDN. Keep authentication for private content.'
    : status === 429 ? 'Review rate limits and server logs, then rerun after the limit resets.'
      : 'Inspect the application, server and CDN logs for this URL, correct the response problem and rerun the audit.'
export const httpStatusRule: Rule = {
  id: 'http-status', name: 'HTTP response status', enabled: true, what: 'http',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/crawling/docs/troubleshooting/http-status-codes', 'https://www.iana.org/assignments/http-status-codes'],
    description: 'Names and explains the captured main-document status. Missing capture is not a site error; 304 is cache revalidation.',
    userGuide: {
      check: 'Reports the status captured for the main document in this audit. Response headers are supporting evidence; the code is still reported when headers are unavailable.',
      action: 'Review the response for the listed page URL and correct it if it does not match the intended behavior.',
    },
  },
  async run(page) {
    const status = page.status
    if (!status || status < 100 || status > 599 || !Number.isInteger(status)) return {
      label: 'HTTP', name: 'HTTP response status', type: 'runtime_error', priority: 100,
      message: 'HTTP response status was not captured; the page response could not be checked.',
      details: { pageUrl: page.url, nextStep: 'Reload the page and rerun the audit so the main-document response can be captured.' },
    }
    return {
      label: 'HTTP', name: 'HTTP response status', message: httpStatusLabel(status),
      type: status >= 400 ? 'error' : status >= 200 && status < 300 ? 'ok' : 'info', priority: status >= 400 ? 50 : 800,
      details: { pageUrl: page.url, status, interpretation: interpretation(status),
        ...(status >= 400 ? { nextStep: nextStep(status) } : {}),
        ...(page.headers ? { httpHeaders: page.headers } : {}) },
    }
  },
}
