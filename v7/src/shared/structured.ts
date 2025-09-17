type Node = Record<string, unknown>

const flatten = (v: unknown): Node[] => {
  if (!v) return []
  if (Array.isArray(v)) return v.flatMap(flatten) as Node[]
  if (typeof v === 'object') {
    const o = v as Node
    if (Array.isArray(o['@graph'])) return flatten(o['@graph'])
    return [o]
  }
  return []
}

export const parseLd = (doc: Document): Node[] => {
  const out: Node[] = []
  doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try { out.push(...flatten(JSON.parse(s.textContent || 'null'))) } catch { /* ignore */ }
  })
  return out
}

const typeList = (n: Node): string[] => {
  const t = n['@type']
  if (!t) return []
  return (Array.isArray(t) ? t : [t]).map((x) => String(x).toLowerCase())
}

export const findType = (nodes: Node[], type: string) => nodes.filter((n) => typeList(n).some((t) => t.includes(type.toLowerCase())))

export const get = (o: unknown, path: string): unknown => {
  let cur: unknown = o
  for (const k of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined
    const obj = cur as Record<string, unknown>
    cur = obj[k]
  }
  return cur
}

export const docs = (key: string) => {
  const base = 'https://developers.google.com/search/docs/appearance/structured-data'
  const map: Record<string, string> = {
    article: `${base}/article`, product: `${base}/product`, faq: `${base}/faqpage`, howto: `${base}/how-to`,
    recipe: `${base}/recipe`, event: `${base}/event`, jobposting: `${base}/job-posting`, video: `${base}/video`,
    breadcrumb: `${base}/breadcrumb`, organization: `${base}/logo`, localbusiness: `${base}/local-business`,
    website: `${base}/sitelinks-searchbox`, review: `${base}/review-snippet`,
  }
  return map[key.toLowerCase()] || base
}
