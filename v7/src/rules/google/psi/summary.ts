import { PSI_AUDIT, type PSIAuditId, type PSIResult } from '@/shared/psiSlim'

type Strategy = 'mobile' | 'desktop'

const roundMs = (value: unknown) => (typeof value === 'number' ? Math.round(value) : undefined)
const roundCls = (value: unknown) => (typeof value === 'number' ? Number(value.toFixed(3)) : undefined)
const compact = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')) as T

export const summarizePSI = (result: PSIResult, url: string, strategy: Strategy) => {
  const lighthouse = result.lighthouseResult || {}
  const audits = lighthouse.audits || {}
  const pick = (id: PSIAuditId) => roundMs(audits[id]?.numericValue)
  const scoreRaw = lighthouse.categories?.performance?.score

  const finalUrl = lighthouse.finalDisplayedUrl || lighthouse.finalUrl || url
  const testUrl = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(finalUrl)}&form_factor=${strategy}`

  const base = {
    url,
    strategy,
    score: typeof scoreRaw === 'number' && Number.isFinite(scoreRaw) ? Math.round(scoreRaw * 100) : undefined,
    fcpMs: pick(PSI_AUDIT.fcp),
    lcpMs: pick(PSI_AUDIT.lcp),
    tbtMs: pick(PSI_AUDIT.tbt),
    speedIndexMs: pick(PSI_AUDIT.speedIndex),
    cls: roundCls(audits[PSI_AUDIT.cls]?.numericValue),
    fetchTime: lighthouse.fetchTime,
    finalDisplayedUrl: finalUrl,
    testUrl,
    userAgent: lighthouse.userAgent,
    runtimeError: lighthouse.runtimeError,
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
