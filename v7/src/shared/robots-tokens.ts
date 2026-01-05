import type { RobotsDirective } from './robots'

export type RobotsTokenMatch = {
  ua: string
  source: 'meta' | 'header'
  token: string
  value?: string
  domPath?: string
  sourceHtml?: string
  headerKey?: string
}

const matchToken = (token: string, key: string) => {
  const normalized = token.trim().toLowerCase()
  const keyLower = key.toLowerCase()
  if (normalized === keyLower) return { token: normalized, value: undefined }
  const prefix = `${keyLower}:`
  if (normalized.startsWith(prefix)) {
    return { token: normalized, value: normalized.slice(prefix.length).trim() }
  }
  return null
}

export const findRobotsTokens = (directives: RobotsDirective[], key: string): RobotsTokenMatch[] => {
  const matches: RobotsTokenMatch[] = []
  directives.forEach((dir) => {
    dir.tokens.forEach((token) => {
      const match = matchToken(token, key)
      if (!match) return
      matches.push({
        ua: dir.ua,
        source: dir.source,
        token: match.token,
        value: match.value,
        domPath: dir.domPath,
        sourceHtml: dir.sourceHtml,
        headerKey: dir.headerKey,
      })
    })
  })
  return matches
}

export type DirectiveNumber = {
  raw: string
  value: number | null
  valid: boolean
}

export const parseDirectiveNumber = (rawValue: string | undefined): DirectiveNumber => {
  const raw = (rawValue || '').trim()
  if (!raw) return { raw, value: null, valid: false }
  if (!/^-?\d+$/.test(raw)) return { raw, value: null, valid: false }
  const value = Number.parseInt(raw, 10)
  if (Number.isNaN(value) || value < -1) return { raw, value, valid: false }
  return { raw, value, valid: true }
}
