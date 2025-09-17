export type Rule = { id: string; name: string; body: string; enabled: boolean }
export const runAll: (rules: Rule[], ctx: { events: unknown[]; html: string; globals?: unknown }) => Promise<unknown[]>
