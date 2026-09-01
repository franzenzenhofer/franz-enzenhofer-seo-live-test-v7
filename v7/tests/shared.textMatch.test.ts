import { describe, expect, it } from 'vitest'

import { messageContainsValue, messageRepeatsValue } from '@/shared/resultPreview'

const heading = 'Stocker mit Plan für „Zukunftsdepot“'

describe('messageRepeatsValue', () => {
  it('detects a value the message contains verbatim', () => {
    expect(messageRepeatsValue(`1 <h1> found: ${heading}`, heading)).toBe(true)
  })

  it('detects a value the message wraps in quotes', () => {
    expect(messageRepeatsValue(`1 <h1> found: "${heading}"`, heading)).toBe(true)
  })

  it('detects a truncated quote of the value', () => {
    const value = 'A rather long meta description that the verdict message can only quote in part before cutting off'
    expect(messageRepeatsValue(`Meta description (98 chars): "${value.slice(0, 40)}…"`, value)).toBe(true)
  })

  it('does not fire when the message says something else', () => {
    expect(messageRepeatsValue('Title set.', heading)).toBe(false)
    expect(messageRepeatsValue(undefined, heading)).toBe(false)
  })

  it('is case- and whitespace-insensitive', () => {
    expect(messageRepeatsValue('Found: STOCKER  MIT PLAN für „zukunftsdepot“', heading)).toBe(true)
  })
})

describe('messageContainsValue', () => {
  it('requires full containment - a truncated quote is not enough', () => {
    const value = 'A rather long meta description that the verdict message can only quote in part before cutting off'
    expect(messageContainsValue(`Meta description: "${value.slice(0, 40)}…"`, value)).toBe(false)
    expect(messageContainsValue(`Meta description: "${value}"`, value)).toBe(true)
  })
})
