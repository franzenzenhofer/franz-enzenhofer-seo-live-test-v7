// The rules read only these Lighthouse audits (rules/google/psi/summary.ts). Everything else in
// a PSI v5 response - full-page screenshot, thumbnails, network requests - is ~870 KB of dead
// weight per URL that would fill the 10 MB chrome.storage.session quota after a handful of tests.
export const PSI_AUDIT = {
  fcp: 'first-contentful-paint',
  lcp: 'largest-contentful-paint',
  tbt: 'total-blocking-time',
  speedIndex: 'speed-index',
  cls: 'cumulative-layout-shift',
} as const
export type PSIAuditId = (typeof PSI_AUDIT)[keyof typeof PSI_AUDIT]
export const PSI_AUDIT_IDS: readonly PSIAuditId[] = Object.values(PSI_AUDIT)

export type PSIAudit = { numericValue?: number }
export type PSIRuntimeError = { code?: string; message?: string }
export type PSILighthouse = {
  audits?: Partial<Record<PSIAuditId, PSIAudit>>
  categories?: { performance?: { score?: number | null } }
  fetchTime?: string
  finalDisplayedUrl?: string
  finalUrl?: string
  runWarnings?: string[]
  userAgent?: string
  runtimeError?: PSIRuntimeError
}
export type PSIResult = { lighthouseResult?: PSILighthouse }

type Dict = Record<string, unknown>
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)
const num = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined)
const strings = (v: unknown): string[] | undefined =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : undefined
const defined = <T extends object>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T

const slimAudits = (audits: unknown): PSILighthouse['audits'] => {
  if (!isDict(audits)) return undefined
  const kept = PSI_AUDIT_IDS.flatMap((id): [PSIAuditId, PSIAudit][] => {
    const audit = audits[id]
    return isDict(audit) ? [[id, defined({ numericValue: num(audit['numericValue']) })]] : []
  })
  return Object.fromEntries(kept)
}

const slimScore = (categories: unknown): PSILighthouse['categories'] => {
  const perf = isDict(categories) ? categories['performance'] : undefined
  if (!isDict(perf)) return undefined
  const score = perf['score']
  return { performance: defined({ score: score === null ? null : num(score) }) }
}

const slimRuntimeError = (err: unknown): PSIRuntimeError | undefined =>
  isDict(err) ? defined({ code: str(err['code']), message: str(err['message']) }) : undefined

// Projects a parsed PSI response down to exactly what summarizePSI consumes. Applied once at the
// network boundary, so the cached entry and the value handed to the rules are the same object.
export const slimPSI = (response: Dict): PSIResult => {
  const lr = response['lighthouseResult']
  if (!isDict(lr)) return {}
  return {
    lighthouseResult: defined({
      audits: slimAudits(lr['audits']),
      categories: slimScore(lr['categories']),
      fetchTime: str(lr['fetchTime']),
      finalDisplayedUrl: str(lr['finalDisplayedUrl']),
      finalUrl: str(lr['finalUrl']),
      runWarnings: strings(lr['runWarnings']),
      userAgent: str(lr['userAgent']),
      runtimeError: slimRuntimeError(lr['runtimeError']),
    }),
  }
}
