import { normalizeRobotsPath, robotsPathMatches } from '@/vendor/robotsPath'

// Presentation-only re-derivation of which robots.txt line(s) decided the
// verdict already computed by @/vendor/robots' parse(); mirrors its private
// group-selection so evidence can name a line number, but never influences
// the actual allowed/disallowed result.
type Directive = { key: 'allow' | 'disallow'; val: string; line: number }
type Group = { uas: string[]; rules: Directive[] }

const parseGroups = (txt: string): Group[] => {
  const groups: Group[] = []
  let current: Group | null = null
  let lastKey = ''
  txt.split(/\r\n|\r|\n/).forEach((raw, index) => {
    let line = raw.trim()
    if (!line || line.startsWith('#')) return
    if (line.includes('#')) line = line.slice(0, line.indexOf('#')).trim()
    const i = line.indexOf(':')
    if (i === -1) return
    const key = line.slice(0, i).trim().toLowerCase()
    const val = line.slice(i + 1).trim()
    if (key === 'user-agent') {
      if (lastKey === 'user-agent' && current) current.uas.push(val)
      else { current = { uas: [val], rules: [] }; groups.push(current) }
      lastKey = 'user-agent'
      return
    }
    if (key === 'disallow' || key === 'allow') {
      lastKey = key
      if (current) current.rules.push({ key, val, line: index + 1 })
    }
  })
  return groups
}

const matchLength = (groupUa: string, token: string): number => {
  const g = groupUa.toLowerCase().trim().split(/[/*]/)[0] || ''
  return !g || g === '*' ? -1 : token.startsWith(g) ? g.length : -1
}

const selectGroups = (groups: Group[], ua: string): Group[] => {
  const token = ua.toLowerCase().trim()
  let bestLen = -1
  for (const g of groups) for (const u of g.uas) bestLen = Math.max(bestLen, matchLength(u, token))
  if (bestLen >= 0) return groups.filter((g) => g.uas.some((u) => matchLength(u, token) === bestLen))
  return groups.filter((g) => g.uas.some((u) => u.trim() === '*'))
}

export const matchingRuleEvidence = (txt: string, path: string, ua: string) => {
  const groups = selectGroups(parseGroups(txt), ua)
  const groupLabel = groups.length ? groups.flatMap((g) => g.uas).join(', ') : 'No applicable group'
  let best = -1
  let matches: Directive[] = []
  for (const group of groups) for (const rule of group.rules) {
    if (!robotsPathMatches(path, rule.val)) continue
    const prio = normalizeRobotsPath(rule.val.trim()).length
    if (prio > best) { best = prio; matches = [rule] } else if (prio === best) matches.push(rule)
  }
  return { groupLabel, matches }
}
