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
export type RuleInput = 'static' | 'idle' | 'compare' | 'context'
export type Page = {
  html: string                 // caller-provided HTML; empty in the compact browser pipeline
  staticHtml?: string          // optional caller-provided static HTML
  url: string
  doc: Document                // caller DOM or compact static-fact document
  staticDoc?: Document         // alias of doc for context rules
  status?: number
  statusLine?: string
  headers?: Record<string, string>
  headerSource?: 'events' | 'probe'
  headerChain?: Array<{ url: string; status?: number; statusLine?: string; location?: string; redirectUrl?: string; fromCache?: boolean }>
  fromCache?: boolean
  ip?: string
  navigationTiming?: { nextHopProtocol?: string | null; transferSize?: number; encodedBodySize?: number; decodedBodySize?: number; type?: string | null; firstPaint?: number | null; firstContentfulPaint?: number | null }
  resources?: string[]
  resourceCount?: number
  resourceDropped?: number
  // Enriched fields (optional, derived from events)
  firstUrl?: string
  lastUrl?: string
  rawHeaders?: Record<string, string | undefined>
  domIdleDoc?: Document
  domEndDoc?: Document
  domContentLoadedDoc?: Document
  staticDomAvailable?: boolean
  idleDomAvailable?: boolean
  phaseResults?: Result[]
  staticFacts?: DomPhaseFacts
  idleFacts?: DomPhaseFacts
}
export type Ctx = { globals: Record<string, unknown> }
export type Rule = {
  id: string
  input?: RuleInput
  name: string
  enabled: boolean
  what?: string
  timeout?: { mode?: 'fast' | 'api' | 'multipage'; timeoutMs?: number }
  run: (page: Page, ctx: Ctx) => Promise<Result>
}
export type RegisteredRule = Rule & { input: RuleInput }
import type { DomPhaseFacts } from '@/shared/domFacts.types'
