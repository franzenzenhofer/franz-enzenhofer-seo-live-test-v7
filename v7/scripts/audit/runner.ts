// Orchestrates B1/B2/B3 audit agents, writes each JSON contract to
// v7/test-results/audit/, and exits non-zero if any agent flagged blocking.

import fs from 'node:fs'
import path from 'node:path'

import { runB1 } from './b1-heap-soak'
import { runB2 } from './b2-perf-trace'
import { runB3 } from './b3-chaos'
import type { AuditReport } from './contract'

const SOAK_SECONDS = parseInt(process.env['EXT_AUDIT_SOAK'] || '30', 10)
const outDir = path.resolve(new URL('../../test-results/audit', import.meta.url).pathname)

const writeReport = (r: AuditReport): void => {
  fs.mkdirSync(outDir, { recursive: true })
  const file = path.join(outDir, `${r.agent}.json`)
  fs.writeFileSync(file, JSON.stringify(r, null, 2))
  console.info(`[audit] ${r.agent} -> ${file}`)
  console.info(`[audit] ${r.agent}: ${r.summary}`)
  for (const f of r.findings) console.info(`[audit]   ${f.severity} ${f.id}: ${f.evidence || ''}`)
  console.info(`[audit] metrics:`, r.metrics)
}

const main = async (): Promise<void> => {
  console.info(`[audit] starting (soak=${SOAK_SECONDS}s, outDir=${outDir})`)
  const reports: AuditReport[] = []
  for (const [name, fn] of [
    ['b1', () => runB1(SOAK_SECONDS)] as const,
    ['b2', () => runB2()] as const,
    ['b3', () => runB3()] as const,
  ]) {
    try {
      const r = await fn()
      writeReport(r)
      reports.push(r)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[audit] ${name} threw: ${msg}`)
      reports.push({ agent: name, summary: `threw: ${msg}`, findings: [], metrics: {}, blocking: true, startedAt: new Date().toISOString(), finishedAt: new Date().toISOString() })
    }
  }
  const blocking = reports.filter((r) => r.blocking)
  if (blocking.length) {
    console.error(`[audit] FAILED: ${blocking.length} agent(s) blocking: ${blocking.map((r) => r.agent).join(', ')}`)
    process.exit(1)
  }
  console.info('[audit] OK: all agents within budget')
}

main().catch((err) => { console.error('[audit] fatal:', err); process.exit(2) })
