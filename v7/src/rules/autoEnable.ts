import type { Rule } from '@/core/types'

type Flags = Record<string, boolean>
type Vars = Record<string, unknown> | undefined
type Auto = { id: string; vars?: string[]; token?: boolean }
type Opts = { flags?: Flags; vars?: Vars; hasToken?: boolean }

const autoRules: Auto[] = [
  { id: 'psi:mobile', vars: ['google_page_speed_insights_key'] },
  { id: 'psi:desktop', vars: ['google_page_speed_insights_key'] },
  { id: 'psi:mobile-fcp-tbt', vars: ['google_page_speed_insights_key'] },
  { id: 'gsc:property-available', token: true },
  { id: 'gsc:is-indexed', vars: ['gsc_site_url'], token: true },
  { id: 'gsc:top-queries-of-page', vars: ['gsc_site_url'], token: true },
  { id: 'gsc:page-worldwide', vars: ['gsc_site_url'], token: true },
  { id: 'gsc:directory-worldwide', vars: ['gsc_site_url'], token: true },
]

const hasVars = (need: string[] | undefined, vars: Vars) => !need || need.every((key) => {
  const val = vars?.[key]
  return typeof val === 'string' ? val.trim().length > 0 : Boolean(val)
})

export const isAutoEnabled = (id: string, vars?: Vars, hasToken?: boolean) => {
  const entry = autoRules.find((r) => r.id === id)
  if (!entry) return false
  if (entry.token && !hasToken) return false
  return hasVars(entry.vars, vars)
}

export const resolveEnabledRules = (rules: Rule[], opts: Opts) => {
  const { flags, vars, hasToken } = opts
  return rules.filter((rule) => {
    const override = flags?.[rule.id]
    if (typeof override === 'boolean') return override
    if (isAutoEnabled(rule.id, vars, hasToken)) return true
    return rule.enabled
  })
}
