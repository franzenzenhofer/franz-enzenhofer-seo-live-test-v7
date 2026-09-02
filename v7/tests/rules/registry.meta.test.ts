import { describe, expect, it } from 'vitest'

import { registry } from '@/rules/registry'
import { isDebugRuleId } from '@/rules/debugRules'

// Static, zero-skip enforcement: every rule carries typed meta with verified
// spec references. No rule execution, so no mock-page escape hatches.

const GOOGLE_HOSTS = [
  'developers.google.com', 'support.google.com', 'search.google.com',
  'web.dev', 'developer.chrome.com', 'blog.google', 'developers.googleblog.com',
]
const STANDARD_HOSTS = [
  'html.spec.whatwg.org', 'fetch.spec.whatwg.org', 'dom.spec.whatwg.org', 'url.spec.whatwg.org',
  'www.w3.org', 'w3.org', 'www.rfc-editor.org', 'rfc-editor.org', 'datatracker.ietf.org',
  'schema.org', 'ogp.me', 'amp.dev', 'wicg.github.io', 'httpwg.org', 'www.sitemaps.org',
]

const hostOf = (url: string) => new URL(url).hostname

describe('registry meta', () => {
  it('every rule declares meta with a valid provenance', () => {
    for (const rule of registry) {
      expect(rule.meta, `${rule.id} has no meta`).toBeDefined()
      expect(['google', 'standard', 'franz', 'general'], `${rule.id} provenance`).toContain(rule.meta.provenance)
    }
  })

  it('every reference is a valid https URL', () => {
    for (const rule of registry) {
      for (const ref of rule.meta.references) {
        expect(() => new URL(ref), `${rule.id}: unparseable reference ${ref}`).not.toThrow()
        expect(ref.startsWith('https://'), `${rule.id}: non-https reference ${ref}`).toBe(true)
      }
    }
  })

  it('every non-franz rule has at least one reference', () => {
    for (const rule of registry) {
      if (rule.meta.provenance === 'franz') continue
      expect(rule.meta.references.length, `${rule.id} has no references`).toBeGreaterThan(0)
    }
  })

  it('google-provenance rules cite Google documentation first', () => {
    for (const rule of registry) {
      if (rule.meta.provenance !== 'google') continue
      const primary = rule.meta.references[0]!
      expect(GOOGLE_HOSTS, `${rule.id}: primary reference ${primary} is not a Google doc`).toContain(hostOf(primary))
    }
  })

  it('standard-provenance rules cite a web standard first', () => {
    for (const rule of registry) {
      if (rule.meta.provenance !== 'standard') continue
      const primary = rule.meta.references[0]!
      expect(STANDARD_HOSTS, `${rule.id}: primary reference ${primary} is not a standards body`).toContain(hostOf(primary))
    }
  })

  it('never cites the Quality Rater Guidelines as a reference', () => {
    for (const rule of registry) {
      for (const ref of rule.meta.references) {
        expect(ref.toLowerCase().includes('searchqualityevaluatorguidelines'), `${rule.id}: QRG cited`).toBe(false)
      }
    }
  })

  it('debug rules are franz provenance', () => {
    for (const rule of registry.filter((r) => isDebugRuleId(r.id))) {
      expect(rule.meta.provenance, rule.id).toBe('franz')
    }
  })
})
