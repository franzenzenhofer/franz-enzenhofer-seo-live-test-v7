import type { Rule } from '@/core/types'

export const mobileFriendlyRule: Rule = {
  id: 'mft:mobile-friendly',
  name: 'Mobile Friendly Test',
  enabled: false,
  async run(page, ctx) {
    const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
    const key = String((vars as Record<string, unknown>)['google_mobile_friendly_test_key'] || '').trim()
    if (!key) return { label: 'MFT', message: 'No MFT key set', type: 'info', name: '$(basename ${f%.ts})' }
    const u = `https://searchconsole.googleapis.com/v1/urlTestingTools/mobileFriendlyTest:run?key=${encodeURIComponent(key)}`
    const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: page.url }) })
    if (!r.ok) return { label: 'MFT', message: `MFT error ${r.status}`, type: 'warn', name: '$(basename ${f%.ts})' }
    const j = await r.json()
    const verdict = (j.mobileFriendliness || '').toLowerCase()
    return { label: 'MFT', message: `Mobile friendly: ${verdict || 'unknown'}`, type: verdict === 'mobile_friendly' ? 'ok' : 'warn' }
  },
}
