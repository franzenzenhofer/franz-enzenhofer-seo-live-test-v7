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
    finalDisplayedUrl: lighthouse.finalDisplayedUrl || lighthouse.finalUrl,
    userAgent: lighthouse.userAgent,
  }

  const warnings = Array.isArray(lighthouse.runWarnings)
    ? lighthouse.runWarnings.filter((w) => typeof w === 'string' && w.trim()).slice(0, 5)
    : null

  const withWarnings = warnings && warnings.length ? { ...base, warnings } : base

  return compact(withWarnings)
}
