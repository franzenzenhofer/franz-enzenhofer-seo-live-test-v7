import { describe, it, expect, vi } from 'vitest'

import { parseHtmlDocument } from '@/shared/parseHtml'

const HTML = '<!doctype html><html><head><link rel="canonical" href="https://x.test/a"></head><body><p>hi</p></body></html>'

describe('parseHtmlDocument', () => {
  it('parses via DOMParser when the runtime provides one', () => {
    const doc = parseHtmlDocument(HTML)
    expect(doc.querySelector('link[rel~="canonical" i]')?.getAttribute('href')).toBe('https://x.test/a')
  })

  it('resolves the parser from the reference window when it is not a global (CLI/node)', () => {
    // Node has no global DOMParser; jsdom hangs it off the document's window.
    const RealParser = globalThis.DOMParser
    const reference = { defaultView: { DOMParser: RealParser } } as unknown as Document
    vi.stubGlobal('DOMParser', undefined)
    try {
      const doc = parseHtmlDocument(HTML, reference)
      expect(doc.querySelector('link[rel~="canonical" i]')?.getAttribute('href')).toBe('https://x.test/a')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('fails loudly when no parser is reachable', () => {
    vi.stubGlobal('DOMParser', undefined)
    try {
      expect(() => parseHtmlDocument(HTML)).toThrow('No HTML parser available')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
