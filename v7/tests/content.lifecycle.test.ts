import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('content lifecycle manifest', () => {
  it('registers separate document_end and document_idle entrypoints', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/manifest.ts'), 'utf8')

    expect(source).toContain("js: ['src/content/documentEnd.ts'], run_at: 'document_end'")
    expect(source).toContain("js: ['src/content/index.ts'], run_at: 'document_idle'")
  })

  it('does not synthesize document_end from the idle entrypoint', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/content/index.ts'), 'utf8')

    expect(source).not.toContain('initDomCapture')
    expect(source).toContain("captureDomPhase('document_idle'")
  })

  it('does not serialize or hash full DOM HTML', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/content/domCapture.ts'), 'utf8')

    expect(source).not.toContain('.innerHTML')
    expect(source).not.toContain('capHtmlForMessageAsync')
    expect(source).not.toContain('htmlSha256')
  })
})
