export type PhaseSignal = { count: number; fingerprint: string }
export type SeoPhaseSignals = Record<string, PhaseSignal>

const SELECTORS: Record<string, string> = {
  title: 'title', description: 'meta[name="description" i]', canonical: 'link[rel~="canonical" i]',
  robots: 'meta[name="robots" i],meta[name^="googlebot" i]', hreflang: 'link[hreflang]',
  headings: 'h1,h2,h3,h4,h5,h6', links: 'a', structuredData: 'script[type="application/ld+json"]', images: 'img,source',
}

const FNV_OFFSET = 2166136261
const FNV_PRIME = 16777619
const SEPARATOR = 0x1f
const ATTRIBUTES = ['name', 'content', 'rel', 'href', 'hreflang', 'src', 'srcset', 'sizes', 'alt']

export const collectSeoPhaseSignals = (doc: Document): SeoPhaseSignals => Object.fromEntries(
  Object.entries(SELECTORS).map(([key, selector]) => {
    const nodes = doc.querySelectorAll(selector)
    // FNV-1a over every matched value, with a real separator byte between them
    // so ["ab", ""] and ["a", "b"] cannot collide. A 32-bit hash is a CHANGE
    // heuristic: equal fingerprints are strong evidence of no change, never
    // proof of semantic equality.
    let hash = FNV_OFFSET
    const append = (value: string) => {
      for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), FNV_PRIME) >>> 0
      hash = Math.imul(hash ^ SEPARATOR, FNV_PRIME) >>> 0
    }
    nodes.forEach((node) => {
      append(node.tagName)
      for (const name of ATTRIBUTES) append(node.getAttribute(name) || '')
      // JSON-LD keeps its RAW text: whitespace is significant inside JSON string
      // values, and normalizing it would hide a real content change.
      if (key === 'structuredData') append(node.textContent || '')
      else if (key === 'title' || key === 'headings') append((node.textContent || '').replace(/\s+/g, ' ').trim())
    })
    return [key, { count: nodes.length, fingerprint: hash.toString(16) }]
  }),
)
