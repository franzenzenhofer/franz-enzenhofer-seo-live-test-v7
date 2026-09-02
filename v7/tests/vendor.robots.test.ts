import { describe, expect, it } from 'vitest'

import parseRobots from '@/vendor/robots'

const URL_A = 'https://ex.com/private/page'

describe('vendor robots.txt parser - RFC 9309 group selection', () => {
  it('uses only the most specific matching group, never merged with *', () => {
    // RFC 9309 sec 2.2.1 / Google: specific groups and global (*) groups are not combined
    const txt = 'User-agent: *\nDisallow: /private/\n\nUser-agent: Googlebot\nDisallow:\n'
    const r = parseRobots(txt, URL_A, 'Googlebot')
    expect(r.allowed).toBe(true)
  })

  it('falls back to the * group when no specific group matches', () => {
    const txt = 'User-agent: *\nDisallow: /private/\n\nUser-agent: bingbot\nDisallow:\n'
    const r = parseRobots(txt, URL_A, 'Googlebot')
    expect(r.allowed).toBe(false)
  })

  it('matches product tokens, not substrings - group "bot" must not match Googlebot', () => {
    const txt = 'User-agent: bot\nDisallow: /private/\n'
    const r = parseRobots(txt, URL_A, 'Googlebot')
    expect(r.allowed).toBe(true)
  })

  it('prefers googlebot-news over googlebot for the Googlebot-News crawler', () => {
    const txt = 'User-agent: googlebot\nDisallow: /private/\n\nUser-agent: googlebot-news\nDisallow:\n'
    const r = parseRobots(txt, URL_A, 'Googlebot-News')
    expect(r.allowed).toBe(true)
  })

  it('merges multiple groups naming the same agent', () => {
    const txt = 'User-agent: googlebot\nDisallow: /private/\n\nUser-agent: googlebot\nAllow: /private/page\n'
    const r = parseRobots(txt, URL_A, 'Googlebot')
    // longest-match precedence: Allow /private/page beats Disallow /private/
    expect(r.allowed).toBe(true)
  })

  it('keeps longest-match precedence with allow winning ties', () => {
    const txt = 'User-agent: *\nDisallow: /private/\nAllow: /private/\n'
    const r = parseRobots(txt, URL_A, 'Googlebot')
    expect(r.allowed).toBe(true)
  })
})
