export const allowedScheme = (url: string) => {
  const s = (url.split(':', 1)[0] || '').toLowerCase()
  return s === 'http' || s === 'https' || s === 'file'
}

export const hasDomSnapshot = (ev: Array<{ t: string; d?: { html?: string } }>) =>
  ev.some((e) => e.t.startsWith('dom:') && !!e.d && typeof e.d.html === 'string' && e.d.html!.length > 0)

export const derivePageUrl = (ev: Array<{ t: string; u?: string }>) => {
  const nav = ev.filter((e) => !!e.u && e.t.startsWith('nav:'))
  const lastNav = nav.length ? (nav[nav.length - 1]!.u || '') : ''
  return lastNav || (([...ev].reverse().find((e) => !!e.u)?.u as string | undefined) || '')
}

export const getPageUrl = async (tabId: number, ev: Array<{ t: string; u?: string }>) => {
  let pageUrl = derivePageUrl(ev)
  if (!pageUrl) {
    try {
      const tab = await chrome.tabs.get(tabId)
      pageUrl = tab.url || ''
    } catch {
      pageUrl = ''
    }
  }
  return pageUrl
}

export const checkUrlChange = async (tabId: number, currentUrl: string, readMeta: (tabId: number) => Promise<{ url?: string } | null>) => {
  const prevMeta = await readMeta(tabId)
  const prevUrl = prevMeta?.url || ''
  return prevUrl && currentUrl && prevUrl !== currentUrl ? { changed: true, prevUrl, currentUrl } : { changed: false, prevUrl: '', currentUrl: '' }
}

export const summarizeEvents = (ev: Array<{ t: string; u?: string }>) => {
  const c = new Map<string, number>()
  for (const e of ev) c.set(e.t, (c.get(e.t) || 0) + 1)
  const top = [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t, n]) => `${t}:${n}`).join(', ')
  const navs = ev.filter((e) => e.t.startsWith('nav:')).length
  const reqs = ev.filter((e) => e.t === 'req:headers').length
  return { top, navs, reqs }
}

const withoutPending = <T extends { type?: string }>(list: T[] | undefined) =>
  Array.isArray(list) ? list.filter((item) => item?.type !== 'pending') : list

export const dedupRunner = <T extends { name?: string; message?: string }>(list: T[]) =>
  list.filter((r, i, a) => r.name !== 'system:runner' || a.findIndex((x) => x.name === r.name && x.message === r.message) === i)

type MinimalResult = { name?: string; message?: string; type?: string; bestPractice?: boolean }

export const persistResults = async (tabId: number, key: string, prev: MinimalResult[] | undefined, add: MinimalResult[]) => {
  const set = async (arr: MinimalResult[]) => { await chrome.storage.local.set({ [key]: arr }); return arr.length }
  try {
    const prevClean = withoutPending(prev)
    const merged = dedupRunner(prevClean ? [...prevClean, ...add] : add)
    return await set(merged)
  } catch {
    // Quota exceeded or similar. Fallbacks: latest only, then last <=100
    const cleanAdd = withoutPending(add) || []
    try { return await set(cleanAdd) } catch {
      const keep = cleanAdd.slice(-Math.max(10, Math.min(100, cleanAdd.length)))
      return await set(keep)
    }
  }
}
