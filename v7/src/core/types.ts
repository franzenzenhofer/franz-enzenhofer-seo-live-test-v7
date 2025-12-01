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
  runIndex?: number
}
export type Page = {
  html: string                 // static HTML snapshot (alias: staticHtml)
  staticHtml?: string          // alias of html for clarity
  url: string
  doc: Document                // static DOM snapshot (alias: staticDoc)
  staticDoc?: Document         // alias of doc for clarity
  status?: number
  statusLine?: string
  headers?: Record<string, string>
  headerChain?: Array<{ url: string; status?: number; statusLine?: string; location?: string; redirectUrl?: string; fromCache?: boolean }>
  fromCache?: boolean
  ip?: string
  navigationTiming?: { nextHopProtocol?: string | null; transferSize?: number; encodedBodySize?: number; decodedBodySize?: number; type?: string | null; firstPaint?: number | null; firstContentfulPaint?: number | null }
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
  timeout?: { mode?: 'fast' | 'api' | 'multipage'; timeoutMs?: number }
  run: (page: Page, ctx: Ctx) => Promise<Result>
}
