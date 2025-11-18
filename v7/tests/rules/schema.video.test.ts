import { describe, it, expect } from 'vitest'
import { schemaVideoRule } from '@/rules/schema/video'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: video', () => {
  it('passes with all required fields', async () => {
    const json = '<script type="application/ld+json">{"@type":"VideoObject","name":"Tutorial Video","description":"Learn how to code","thumbnailUrl":"https://ex.com/thumb.jpg","uploadDate":"2024-01-01"}</script>'
    const r = await schemaVideoRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('fails when name is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"VideoObject","description":"Description","thumbnailUrl":"https://ex.com/thumb.jpg","uploadDate":"2024-01-01"}</script>'
    const r = await schemaVideoRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('fails when description is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"VideoObject","name":"Video","thumbnailUrl":"https://ex.com/thumb.jpg","uploadDate":"2024-01-01"}</script>'
    const r = await schemaVideoRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('fails when thumbnailUrl is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"VideoObject","name":"Video","description":"Description","uploadDate":"2024-01-01"}</script>'
    const r = await schemaVideoRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('fails when uploadDate is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"VideoObject","name":"Video","description":"Description","thumbnailUrl":"https://ex.com/thumb.jpg"}</script>'
    const r = await schemaVideoRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaVideoRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})

