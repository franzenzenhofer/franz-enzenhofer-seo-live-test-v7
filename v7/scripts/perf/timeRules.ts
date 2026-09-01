import { JSDOM } from 'jsdom'

import { registry } from '@/rules/registry'
import { pageFromHtml } from '@/shared/page'
import { getRuleTimeoutMs } from '@/core/ruleTimeouts'

const url = process.argv[2] || 'https://www.orf.at/'

const main = async () => {
  const res = await fetch(url)
  const html = await res.text()
  const page = await pageFromHtml(html, url, (h: string) => new JSDOM(h).window.document)
  const runnable = registry.filter((r) => r.enabled && (r.input === 'static' || r.input === 'context'))
  const rows: Array<{ id: string; ms: number; to: number; type: string }> = []
  for (const rule of runnable) {
    const t0 = performance.now()
    let type = 'ok'
    try {
      const out = await rule.run(page, { globals: { variables: {}, googleApiAccessToken: null } } as never)
      type = (Array.isArray(out) ? out[0]?.type : (out as { type?: string })?.type) || 'ok'
    } catch (e) { type = 'THROW:' + (e instanceof Error ? e.message : String(e)) }
    rows.push({ id: rule.id, ms: Math.round(performance.now() - t0), to: getRuleTimeoutMs(rule), type })
  }
  rows.sort((a, b) => b.ms - a.ms)
  const total = rows.reduce((s, r) => s + r.ms, 0)
  console.log(`\nURL=${url}  runnable=${rows.length}  serial_total=${(total/1000).toFixed(1)}s\n`)
  console.log('TOP 25 SLOWEST:')
  rows.slice(0, 25).forEach((r) => console.log(`${String(r.ms).padStart(7)}ms  timeout=${String(r.to).padStart(6)}  ${r.id.padEnd(45)} ${r.type}`))
  const over1s = rows.filter((r) => r.ms > 1000)
  console.log(`\nrules >1s: ${over1s.length}  |  their share: ${(over1s.reduce((s,r)=>s+r.ms,0)/total*100).toFixed(1)}%`)
}
main()
