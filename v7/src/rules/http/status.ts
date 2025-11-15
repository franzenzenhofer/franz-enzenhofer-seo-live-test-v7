import type { Rule } from '@/core/types'

const classify = (s?: number) => {
  if (!s) return { t: 'warn', m: 'Status unknown' as const }
  if (s >= 200 && s < 300) return { t: 'ok', m: `HTTP ${s}` as const }
  if (s >= 300 && s < 400) return { t: 'info', m: `Redirect ${s}` as const }
  if (s >= 400) return { t: 'error', m: `HTTP Error ${s}` as const }
  return { t: 'info', m: `HTTP ${s}` as const }
}

export const httpStatusRule: Rule = {
  id: 'http-status',
  name: 'HTTP Status',
  enabled: true,
  what: 'http',
  run: async (page) => {
    const c = classify(page.status)
    return {
      label: 'HTTP',
      message: c.m,
      type: c.t as 'ok' | 'warn' | 'error' | 'info',
      name: 'httpStatus',
      details: {
        httpHeaders: page.headers || {},
      },
    }
  },
}
