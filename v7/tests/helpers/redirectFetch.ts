import { vi } from 'vitest'

export type ScriptedHop = {
  status: number
  location?: string
  url?: string
  body?: string
  type?: string
}

export const chainResponse = (url: string, hop: ScriptedHop): Response => {
  const cancel = vi.fn().mockResolvedValue(undefined)
  return {
    status: hop.status,
    type: hop.type ?? 'basic',
    url: hop.url ?? url,
    redirected: false,
    headers: new Headers(hop.location ? { location: hop.location } : {}),
    body: { cancel },
    text: async () => hop.body ?? '',
  } as unknown as Response
}

/** Scripts fetch responses per URL so redirect chains can be replayed hop by hop. */
export const scriptFetch = (script: Record<string, ScriptedHop>): typeof fetch =>
  vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const hop = script[url]
    if (!hop) throw new Error(`no scripted response for ${url}`)
    return chainResponse(url, hop)
  }) as unknown as typeof fetch
