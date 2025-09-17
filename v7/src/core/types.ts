export type Result = { label: string; message: string; type: 'info'|'ok'|'warn'|'error'; what?: string|null; priority?: number|null }
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
export type Rule = { id: string; name: string; enabled: boolean; run: (page: Page, ctx: Ctx) => Promise<Result|Result[]> }
