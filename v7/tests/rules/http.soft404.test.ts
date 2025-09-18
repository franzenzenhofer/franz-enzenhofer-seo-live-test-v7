import { describe, it, expect } from 'vitest'
import { soft404Rule } from '@/rules/http/soft404'

const P = (html: string, status: number) => ({ html, url:'https://ex.com', doc: new DOMParser().parseFromString('<p/>','text/html'), status })

describe('rule: soft 404', () => {
  it('flags 2xx with 404 text', async () => {
    const r = await soft404Rule.run(P('<h1>404 Not Found</h1>', 200), { globals: {} })
    expect((r as any).type).toBe('warn')
  })
})

