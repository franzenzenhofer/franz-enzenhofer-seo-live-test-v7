export type Result = { label: string; message: string; type: 'info'|'ok'|'warn'|'error'; what?: string|null; priority?: number|null }
export type Page = { html: string; url: string; doc: Document; status?: number; headers?: Record<string,string>; resources?: string[] }
export type Ctx = { globals: Record<string, unknown> }
export type Rule = { id: string; name: string; enabled: boolean; run: (page: Page, ctx: Ctx) => Promise<Result|Result[]> }
