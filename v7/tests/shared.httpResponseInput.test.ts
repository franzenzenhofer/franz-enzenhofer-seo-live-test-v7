import { describe, expect, it } from 'vitest'

import { HEAD_PROBE_RESPONSE, MAIN_DOCUMENT_RESPONSE, NO_NAVIGATION_RESPONSE, httpResponseInput, navigationResponseNote } from '@/shared/httpResponseInput'
import { observedSoftNavigation, sameDocumentUrl, stripFragment } from '@/shared/softNavigation'

describe('softNavigation helpers', () => {
  it('drops only the fragment; query and trailing slash stay significant', () => {
    expect(stripFragment('https://a.test/p?q=1#x')).toBe('https://a.test/p?q=1')
    expect(sameDocumentUrl('https://a.test/p#x', 'https://a.test/p')).toBe(true)
    expect(sameDocumentUrl('https://a.test/p', 'https://a.test/p/')).toBe(false)
    expect(sameDocumentUrl('https://a.test/p', 'https://a.test/p?q=1')).toBe(false)
    expect(sameDocumentUrl(undefined, 'https://a.test/p')).toBe(false)
    expect(stripFragment('not a url#x')).toBe('not a url')
  })

  it('recognises a soft-navigation run: a history update without a document commit', () => {
    expect(observedSoftNavigation([{ t: 'nav:history' }, { t: 'dom:document_idle' }])).toBe(true)
    expect(observedSoftNavigation([{ t: 'nav:commit' }, { t: 'nav:history' }])).toBe(false)
    expect(observedSoftNavigation([])).toBe(false)
  })
})

describe('httpResponseInput', () => {
  it('names the source of the response, or nothing when none was captured', () => {
    expect(httpResponseInput({ status: 200, headers: { a: 'b' }, headerSource: 'events' })).toBe(MAIN_DOCUMENT_RESPONSE)
    expect(httpResponseInput({ status: 200, headers: { a: 'b' }, headerSource: 'probe' })).toBe(HEAD_PROBE_RESPONSE)
    expect(httpResponseInput({ status: 404 })).toBe(MAIN_DOCUMENT_RESPONSE)
    expect(httpResponseInput({ headers: {} })).toBe(false)
  })

  it('states the missing navigation response only for a soft-navigation run', () => {
    expect(navigationResponseNote({ events: [{ t: 'nav:history' }] })).toBe(NO_NAVIGATION_RESPONSE)
    expect(navigationResponseNote({ events: [{ t: 'nav:commit' }, { t: 'nav:history' }] })).toBeNull()
    expect(navigationResponseNote({})).toBeNull()
  })
})
