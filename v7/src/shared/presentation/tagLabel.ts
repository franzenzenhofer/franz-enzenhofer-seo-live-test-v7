// The label an element is known by in a card (FORMATTING.md F4): its tag plus the one attribute
// that identifies it, e.g. <link rel="canonical">, <link hreflang="en">, <meta name="robots">.
const IDENTIFYING = ['hreflang', 'rel', 'name', 'property', 'http-equiv', 'itemprop'] as const
const MAX_VALUE = 40

export const tagLabel = (element: Element): string => {
  const tag = element.tagName.toLowerCase()
  if (tag === 'meta' && element.hasAttribute('charset')) return '<meta charset>'
  if (tag === 'script' && element.getAttribute('type')) return `<script type="${element.getAttribute('type')!.trim().toLowerCase()}">`
  for (const name of IDENTIFYING) {
    const value = element.getAttribute(name)?.trim()
    if (value && value.length <= MAX_VALUE && !/["<>]/.test(value)) return `<${tag} ${name}="${value.toLowerCase()}">`
  }
  return `<${tag}>`
}

/** Labels for several elements; numbered only when one label occurs more than once. */
export const tagLabels = (elements: Element[]): string[] => {
  const labels = elements.map(tagLabel)
  const totals = new Map<string, number>()
  labels.forEach((label) => totals.set(label, (totals.get(label) || 0) + 1))
  const seen = new Map<string, number>()
  return labels.map((label) => {
    if (totals.get(label) === 1) return label
    const index = (seen.get(label) || 0) + 1
    seen.set(label, index)
    return `${label} ${index}`
  })
}
