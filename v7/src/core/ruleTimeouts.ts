import type { Rule } from './types'

const DEFAULT_TIMEOUT_MS = 15000
const API_TIMEOUT_MS = 60000
const MULTIPAGE_TIMEOUT_MS = 600000

const clamp = (value: number) => Math.min(Math.max(value, 1000), MULTIPAGE_TIMEOUT_MS)

const modeTimeout = (mode?: 'fast' | 'api' | 'multipage') => {
  if (mode === 'api') return API_TIMEOUT_MS
  if (mode === 'multipage') return MULTIPAGE_TIMEOUT_MS
  return DEFAULT_TIMEOUT_MS
}

const whatTimeout = (what?: string | null) => {
  if (!what) return DEFAULT_TIMEOUT_MS
  if (what === 'psi' || what === 'gsc') return API_TIMEOUT_MS
  if (what === 'crawler' || what === 'multipage') return MULTIPAGE_TIMEOUT_MS
  return DEFAULT_TIMEOUT_MS
}

export const getRuleTimeoutMs = (rule: Rule) => {
  const explicit = typeof rule.timeout?.timeoutMs === 'number' ? clamp(rule.timeout.timeoutMs) : null
  if (explicit) return explicit
  if (rule.timeout?.mode) return modeTimeout(rule.timeout.mode)
  return whatTimeout(rule.what)
}

export const getRunTimeoutMs = (rules: Rule[]) => {
  return rules.reduce((max, rule) => Math.max(max, getRuleTimeoutMs(rule)), DEFAULT_TIMEOUT_MS)
}

export { DEFAULT_TIMEOUT_MS, API_TIMEOUT_MS, MULTIPAGE_TIMEOUT_MS }
