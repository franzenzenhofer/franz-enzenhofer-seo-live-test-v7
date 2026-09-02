import { describe, it, expect } from 'vitest'
import { schemaVideoRule } from '@/rules/schema/video'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

const run = async (json: string) =>
  schemaVideoRule.run({ html:'', url:'https://ex.com', doc: D(`<script type="application/ld+json">${json}</script>`) } as any, { globals: {} })

describe('schema: video', () => {
  it('passes with all required fields', async () => {
    const r = await run('{"@type":"VideoObject","name":"Tutorial Video","description":"Learn how to code","thumbnailUrl":"https://ex.com/thumb.jpg","uploadDate":"2024-01-01"}')
    expect((r as any).type).toBe('ok')
  })

  it('fails when name is missing', async () => {
    const r = await run('{"@type":"VideoObject","description":"Description","thumbnailUrl":"https://ex.com/thumb.jpg","uploadDate":"2024-01-01"}')
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('name')
  })

  it('reports missing description as recommended (info), not required (warn)', async () => {
    const r = await run('{"@type":"VideoObject","name":"Video","thumbnailUrl":"https://ex.com/thumb.jpg","uploadDate":"2024-01-01"}')
    expect((r as any).type).toBe('info')
    expect((r as any).message).toContain('description')
  })

  it('fails when thumbnailUrl is missing', async () => {
    const r = await run('{"@type":"VideoObject","name":"Video","description":"Description","uploadDate":"2024-01-01"}')
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('thumbnailUrl')
  })

  it('fails when uploadDate is missing', async () => {
    const r = await run('{"@type":"VideoObject","name":"Video","description":"Description","thumbnailUrl":"https://ex.com/thumb.jpg"}')
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('uploadDate')
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaVideoRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})
