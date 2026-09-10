import { expect, it } from 'vitest'

import { advertisedProtocol, headerValue } from '@/shared/headerValue'

it('reads mixed-case field names and only matches unquoted ALPN declarations', () => {
  expect(headerValue({ 'Alt-Svc': 'h2=":443"' }, 'alt-svc')).toBe('h2=":443"')
  expect(advertisedProtocol('h3="h2.example.test:443"', 'h2')).toBe(false)
  expect(advertisedProtocol('h2="host,h3=:443"', 'h3')).toBe(false)
  expect(advertisedProtocol('h2=":443", h3-29=":443"', 'h3')).toBe(true)
  expect(advertisedProtocol('H2=":443"', 'h2')).toBe(false)
})
