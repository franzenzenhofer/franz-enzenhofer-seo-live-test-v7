import type { Rule } from '@/core/types'

const LABEL = 'GSC'
const NAME = 'Mobile Friendly Test'
const RULE_ID = 'gsc:mobile-friendly'
const SPEC = 'https://developers.google.com/search/apis/indexing-api/v1/url-testing-tools/mobile-friendly-test'

const apiKey = (ctx: import('@/core/types').Ctx) => {
  const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
  return String(vars['google_mobile_friendly_test_key'] || '').trim()
}

export const mobileFriendlyRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'gsc',
  timeout: { mode: 'api' },
  async run(page, ctx) {
    const key = apiKey(ctx)
    if (!key) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Mobile Friendly Test API key missing. Set google_mobile_friendly_test_key in settings.',
        type: 'runtime_error',
        priority: -1000,
        details: { reference: SPEC },
      }
    }
    const endpoint = `https://searchconsole.googleapis.com/v1/urlTestingTools/mobileFriendlyTest:run?key=${encodeURIComponent(key)}`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: page.url }),
      })
      if (!res.ok) {
        return { label: LABEL, name: NAME, message: `Mobile Friendly Test error ${res.status}`, type: 'warn', priority: 0, details: { status: res.status, reference: SPEC } }
      }
      const data = await res.json() as { mobileFriendly?: string; mobileFriendlyIssues?: Array<{ rule?: string }> }
      const isFriendly = data.mobileFriendly === 'MOBILE_FRIENDLY'
      const issues = data.mobileFriendlyIssues || []
      return {
        label: LABEL,
        name: NAME,
        message: isFriendly ? 'Mobile-friendly ✅' : `Not mobile-friendly (${issues.length} issue${issues.length === 1 ? '' : 's'})`,
        type: isFriendly ? 'ok' : 'warn',
        priority: isFriendly ? 800 : 200,
        details: { result: data.mobileFriendly, issues, reference: SPEC },
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      return { label: LABEL, name: NAME, message: `Mobile Friendly Test failed: ${msg}`, type: 'runtime_error', priority: -500, details: { reference: SPEC } }
    }
  },
}
