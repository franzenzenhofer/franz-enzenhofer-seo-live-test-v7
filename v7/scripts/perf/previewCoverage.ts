import fs from 'node:fs'
import { resultPreview } from '@/shared/resultPreview'

const rows = JSON.parse(fs.readFileSync(process.argv[2] || '/tmp/cli3.json', 'utf8')) as Array<Record<string, unknown>>
// Only rules that actually captured evidence can show a value. A rule that
// found nothing ("No nosnippet directive found.") has nothing to preview.
const META = new Set(['reference', 'secondaryReference', 'domPath', 'domPaths', 'domPathColors', 'tested', 'validCardTypes', 'allowedValues', 'requiredHeaders', 'url'])
const hasEvidence = (d: Record<string, unknown>) =>
  Object.keys(d).some((k) => !META.has(k)
    && d[k] !== null && d[k] !== undefined && typeof d[k] !== 'boolean' && d[k] !== '' && d[k] !== 0
    && !(Array.isArray(d[k]) && (d[k] as unknown[]).length === 0))
let withPreview = 0, withEvidence = 0, noEvidence = 0
const missing: string[] = []
rows.forEach((r) => {
  const d = r['details'] as Record<string, unknown> | undefined
  if (!d || !Object.keys(d).length) return
  if (!hasEvidence(d)) { noEvidence++; return }
  withEvidence++
  const p = resultPreview(d)
  if (p) withPreview++
  else missing.push(String(r['ruleId']))
})
console.log(`rules with evidence:  ${withEvidence}`)
console.log(`  -> preview derived: ${withPreview}`)
console.log(`  -> still missing:   ${missing.length}  ${missing.slice(0, 25).join(' ')}`)
console.log(`rules with nothing found (correctly no preview): ${noEvidence}`)
console.log('\nSAMPLES:')
rows.filter((r) => ['head-title','head-meta-description','body:h1','head-canonical','head:title-length','dom:html-lang','body:internal-links'].includes(String(r['ruleId'])))
  .forEach((r) => console.log(`  ${String(r['ruleId']).padEnd(24)} "${r['message']}"\n    -> ${resultPreview(r['details'])}`))
