import { describe, expect, it } from 'vitest'

import { splitXRobotsSegments } from '@/shared/robotsHeader'

describe('splitXRobotsSegments', () => {
  it('keeps plain directive lists on the default robots agent', () => {
    const { segments } = splitXRobotsSegments('noindex, nofollow')
    expect(segments).toEqual([
      { ua: 'robots', value: 'noindex' },
      { ua: 'robots', value: 'nofollow' },
    ])
  })

  it('does not mistake valued directives for user agents', () => {
    const { segments } = splitXRobotsSegments('max-snippet: 20')
    expect(segments).toEqual([{ ua: 'robots', value: 'max-snippet: 20' }])
  })

  it('scopes directives after an agent prefix to that agent per the Google spec', () => {
    const { segments } = splitXRobotsSegments('googlebot: noindex, nofollow')
    expect(segments).toEqual([
      { ua: 'googlebot', value: 'noindex' },
      { ua: 'googlebot', value: 'nofollow' },
    ])
  })

  it('keeps RFC 850 dates inside unavailable_after intact', () => {
    const { segments } = splitXRobotsSegments('unavailable_after: Fri, 25 Jun 2010 15:00:00 GMT, nofollow')
    expect(segments).toEqual([
      { ua: 'robots', value: 'unavailable_after: Fri, 25 Jun 2010 15:00:00 GMT' },
      { ua: 'robots', value: 'nofollow' },
    ])
  })

  it('resets the agent scope when a new agent prefix appears', () => {
    const { segments } = splitXRobotsSegments('noindex, googlebot: nofollow, noarchive')
    expect(segments).toEqual([
      { ua: 'robots', value: 'noindex' },
      { ua: 'googlebot', value: 'nofollow' },
      { ua: 'googlebot', value: 'noarchive' },
    ])
  })

  it('honors the bounded contract', () => {
    expect(() => splitXRobotsSegments(Array(1001).fill('noindex').join(','))).toThrow()
  })
})
