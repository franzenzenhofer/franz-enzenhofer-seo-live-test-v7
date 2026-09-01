import type { PSIResult } from '@/shared/psi'

type Strategy = 'mobile' | 'desktop'

const roundMs = (value: unknown) => (typeof value === 'number' ? Math.round(value) : undefined)
const roundCls = (value: unknown) => (typeof value === 'number' ? Number(value.toFixed(3)) : undefined)
const compact = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')) as T

export const summarizePSI = (result: PSIResult, url: string, strategy: Strategy) => {
  const lighthouse = result.lighthouseResult || {}
  const audits = lighthouse.audits || {}
  const pick = (id: string) => roundMs(audits[id]?.numericValue)
  const scoreRaw = lighthouse.categories?.performance?.score

  const finalUrl = lighthouse.finalDisplayedUrl || lighthouse.finalUrl || url
  const testUrl = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(finalUrl)}&form_factor=${strategy}`

  const base = {
    url,
    strategy,
    score: typeof scoreRaw === 'number' ? Math.round(scoreRaw * 100) : 0,
    fcpMs: pick('first-contentful-paint'),
    lcpMs: pick('largest-contentful-paint'),
    tbtMs: pick('total-blocking-time'),
    speedIndexMs: pick('speed-index'),
    cls: roundCls(audits['cumulative-layout-shift']?.numericValue),
    fetchTime: lighthouse.fetchTime,
    finalDisplayedUrl: finalUrl,
    testUrl,
    userAgent: lighthouse.userAgent,
  }

  const warnings = Array.isArray(lighthouse.runWarnings)
    ? lighthouse.runWarnings.filter((w) => typeof w === 'string' && w.trim())
    : null

  const withWarnings = warnings && warnings.length ? { ...base, warnings } : base

  return compact(withWarnings)
}

// Lighthouse score buckets: 90-100 good, 50-89 needs improvement, 0-49 poor.
export type PsiVerdict = { type: 'ok' | 'warn' | 'error'; priority: number }

export const psiScoreVerdict = (score: number): PsiVerdict => {
  if (score >= 90) return { type: 'ok', priority: 850 }
  if (score >= 50) return { type: 'warn', priority: 300 }
  return { type: 'error', priority: 120 }
}
