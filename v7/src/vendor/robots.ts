// Minimal, safe robots.txt parser for browser/ESM environments
// Returns an object with { allowed, disallowed, noindex }

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const matchesPath = (path: string, rule: string) => {
  const v = rule.trim(); if (!v) return false
  let rx = '^' + escapeRe(v).replace(/\*/g, '.*')
  if (!rx.endsWith('$') && !v.endsWith('*')) rx += '.*'
  return new RegExp(rx).test(path)
}

const uaMatches = (uaGroup: string[], ua: string) => {
  const L = ua.toLowerCase(); let best = ''; let hit = false
  for (let u of uaGroup) {
    u = u.toLowerCase().trim(); if (!u) continue
    if (L.includes(u) || u === '*') { if (u.length >= best.length) { best = u; hit = true } }
  }
  return hit
}

export default function parseRobots(txt: string, url: string, ua = 'Googlebot') {
  let best = -1, hasAllow = false, hasDisallow = false, hasNoindex = false
  const p = (()=>{ try{ const u = new URL(url); return u.pathname + u.search }catch{ return '/' } })()
  let group: string[] = [], lastKey = ''
  for (const raw of txt.split('\n')) {
    let line = raw.trim(); if (!line || line.startsWith('#')) continue
    if (line.includes('#')) line = line.slice(0, line.indexOf('#')).trim()
    const i = line.indexOf(':'); if (i === -1) continue
    const key = line.slice(0, i).trim().toLowerCase(); const val = line.slice(i + 1).trim()
    if (key === 'user-agent') { group = lastKey === 'user-agent' ? [...group, val] : [val]; lastKey = 'user-agent'; continue }
    if (key === 'disallow' || key === 'allow' || key === 'noindex') {
      lastKey = key; if (!group.length || !uaMatches(group, ua)) continue
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
