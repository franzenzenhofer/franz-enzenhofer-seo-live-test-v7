// Minimal, safe robots.txt parser for browser/ESM environments
// Returns an object with { allowed, disallowed, noindex }
// Group selection per RFC 9309 sec 2.2.1 (https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.1)
// and https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt:
// the crawler obeys ONLY the most specific matching user-agent group(s); the
// global (*) group applies only when no specific group matches, never merged.

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const matchesPath = (path: string, rule: string) => {
  const v = rule.trim(); if (!v) return false
  let rx = '^' + escapeRe(v).replace(/\*/g, '.*')
  if (!rx.endsWith('$') && !v.endsWith('*')) rx += '.*'
  return new RegExp(rx).test(path)
}

type Group = { uas: string[]; rules: Array<{ key: string; val: string }> }

// Product-token matching: a group's user-agent value matches when it is a
// case-insensitive prefix of the crawler's product token ('googlebot' matches
// Googlebot-News); a bare substring like 'bot' does NOT match Googlebot.
const matchLength = (groupUa: string, token: string): number => {
  const g = groupUa.toLowerCase().trim()
  if (!g || g === '*') return -1
  return token.startsWith(g) ? g.length : -1
}

const parseGroups = (txt: string): Group[] => {
  const groups: Group[] = []
  let current: Group | null = null
  let lastKey = ''
  for (const raw of txt.split('\n')) {
    let line = raw.trim(); if (!line || line.startsWith('#')) continue
    if (line.includes('#')) line = line.slice(0, line.indexOf('#')).trim()
    const i = line.indexOf(':'); if (i === -1) continue
    const key = line.slice(0, i).trim().toLowerCase(); const val = line.slice(i + 1).trim()
    if (key === 'user-agent') {
      if (lastKey === 'user-agent' && current) current.uas.push(val)
      else { current = { uas: [val], rules: [] }; groups.push(current) }
      lastKey = 'user-agent'; continue
    }
    if (key === 'disallow' || key === 'allow' || key === 'noindex') {
      lastKey = key
      if (current) current.rules.push({ key, val })
    }
  }
  return groups
}

const selectGroups = (groups: Group[], ua: string): Group[] => {
  const token = ua.toLowerCase().trim()
  let bestLen = -1
  for (const g of groups) for (const u of g.uas) bestLen = Math.max(bestLen, matchLength(u, token))
  if (bestLen >= 0) return groups.filter((g) => g.uas.some((u) => matchLength(u, token) === bestLen))
  return groups.filter((g) => g.uas.some((u) => u.trim() === '*'))
}

export default function parseRobots(txt: string, url: string, ua = 'Googlebot') {
  const p = (() => { try { const u = new URL(url); return u.pathname + u.search } catch { return '/' } })()
  let best = -1, hasAllow = false, hasDisallow = false, hasNoindex = false
  for (const group of selectGroups(parseGroups(txt), ua)) {
    for (const { key, val } of group.rules) {
      if (!matchesPath(p, val)) continue
      const prio = val.trim().length
      if (prio > best) { best = prio; hasAllow = hasDisallow = false }
      if (prio === best) { if (key === 'allow') hasAllow = true; if (key === 'disallow') hasDisallow = true; if (key === 'noindex') hasNoindex = true }
    }
  }
  const disallowed = best >= 0 && hasDisallow
  const allowed = !disallowed || hasAllow
  return { allowed, disallowed, noindex: hasNoindex }
}
