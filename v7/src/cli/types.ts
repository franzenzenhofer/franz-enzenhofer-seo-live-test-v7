export type Rule = { id: string; name: string; body: string; enabled: boolean }
export type Ctx = { events: unknown[]; html: string; globals?: Record<string, unknown> }
