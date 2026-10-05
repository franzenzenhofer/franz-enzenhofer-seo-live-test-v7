import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { JSDOM } from 'jsdom'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { CHECKS } from './checks'
import type { Violation } from './checks.shared'
import { FIXTURES, runFixtures } from './harness'
import { KNOWN_VIOLATIONS } from './knownViolations'
import type { RuleRun } from './harness'

import { registry } from '@/rules/registry'

// Enforces design/result-template/FORMATTING.md (F1-F14) over every registry rule on realistic pages.
let runs: RuleRun[] = []
// FORMAT_RULES=head-canonical,head-hreflang limits the run to those rule ids (local fixing loop only).
const only = process.env['FORMAT_RULES']?.split(',').map((id) => id.trim()).filter(Boolean)
const found: Violation[] = []
const docs = new Map(FIXTURES.map((fixture) => [fixture.name, new JSDOM(readFileSync(resolve(__dirname, '../fixtures/formatting', fixture.file), 'utf8'), { url: fixture.url }).window.document]))

const violationsOf = (checkId: string): Violation[] => {
  const check = CHECKS.find((candidate) => candidate.id === checkId)!
  return runs.flatMap((run) => {
    const view = run.result.presentation
    if (!view) return [{ ruleId: run.ruleId, fixture: run.fixture, detail: `${checkId} no presentation` }]
    return check.run(view, run, docs.get(run.fixture)!).map((detail) => ({ ruleId: run.ruleId, fixture: run.fixture, detail: `${checkId} ${detail}` }))
  })
}
const describeViolations = (violations: Violation[]) => {
  const rules = [...new Set(violations.map((violation) => violation.ruleId))]
  return `${rules.length} rule(s) violate:\n${violations.map((v) => `  ${v.ruleId} [${v.fixture}] ${v.detail}`).join('\n')}`
}

// Per-rule list of every violation, for fixing and for the report to the owner.
const writeReport = () => {
  const byRule = new Map<string, Violation[]>()
  for (const violation of found) byRule.set(violation.ruleId, [...(byRule.get(violation.ruleId) || []), violation])
  const lines = [`# Formatting violations: ${byRule.size} of ${registry.length} rules`, '']
  for (const [ruleId, list] of [...byRule].sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`## ${ruleId} (${list.length})`, ...list.map((v) => `- [${v.fixture}] ${v.detail}`), '')
  }
  mkdirSync(resolve(__dirname, '../../test-results'), { recursive: true })
  writeFileSync(resolve(__dirname, '../../test-results/formatting-violations.md'), lines.join('\n'))
}

describe('result card formatting (FORMATTING.md)', () => {
  beforeAll(async () => { runs = await runFixtures(only) }, 180_000)
  afterAll(writeReport)
  it('runs every registry rule on every fixture', () => {
    expect(runs).toHaveLength((only?.length ?? registry.length) * FIXTURES.length)
  })
  for (const check of CHECKS) {
    it(`${check.id}: ${check.title}`, () => {
      const violations = violationsOf(check.id)
      found.push(...violations)
      // FORMAT_RULES runs are strict: every violation of the named rules is reported.
      const unexpected = only ? violations : violations.filter((violation) => !KNOWN_VIOLATIONS.includes(violation.ruleId))
      expect(unexpected, describeViolations(unexpected)).toEqual([])
    })
  }
  it('known-violation list only names rules that still violate', () => {
    if (only) return
    const violating = new Set(found.map((violation) => violation.ruleId))
    expect(KNOWN_VIOLATIONS.filter((ruleId) => !violating.has(ruleId)), 'fixed: remove from knownViolations.ts').toEqual([])
  })
})
