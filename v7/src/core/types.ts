export type ResultDetails = {
  snippet?: string
  sourceHtml?: string
  domPath?: string
  domPaths?: string[]
  [key: string]: unknown
}

export type Result = {
  name: string
  label: string
  message: string
  type: 'info'|'ok'|'warn'|'error'|'runtime_error'|'pending'|'disabled'
  what?: string|null
  priority?: number|null
  ruleId?: string|null
  runIdentifier?: string
  details?: ResultDetails
  bestPractice?: boolean
}
export type Page = {
  html: string
  url: string
  doc: Document
  status?: number
  headers?: Record<string, string>
  resources?: string[]
  // Enriched fields (optional, derived from events)
  firstUrl?: string
  lastUrl?: string
  rawHeaders?: Record<string, string | undefined>
  domIdleDoc?: Document
  domEndDoc?: Document
  domContentLoadedDoc?: Document
}
export type Ctx = { globals: Record<string, unknown> }
export type Rule = {
  id: string
  name: string
  enabled: boolean
  what?: string
  bestPractice?: boolean
  timeout?: { mode?: 'fast' | 'api' | 'multipage'; timeoutMs?: number }
  run: (page: Page, ctx: Ctx) => Promise<Result>
}
