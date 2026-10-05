import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { renderToStaticMarkup } from 'react-dom/server'

import { createPresentation, originalField, textField } from '../src/shared/presentation/create'
import { presentationSchema } from '../src/shared/presentation/schema'
import { boundPresentation } from '../src/shared/presentation/bound'
import { markupEvidence, markReconstructed, readOriginalMarkup, registerOriginal } from '../src/shared/presentation/originalMarkup'
import { presentationCopy } from '../src/shared/presentation/copy'
import { PresentationCard } from '../src/components/presentation/Card'
import { getResultLabel, resultTypeOrder } from '../src/shared/colors'
import { countResultTypes } from '../src/background/rules/counts'
import { createDefaultTypeVisibility } from '../src/shared/resultFilterState'
import { boundResult } from '../src/shared/boundResult'

const markup = '<title lang="de" data-template="trip"> A &amp; B </title>'
const view = () => createPresentation({ name: 'Page title', input: 'Static DOM', pageUrl: 'https://example.test/',
  values: [textField('Title elements', 1), originalField('<title>', markup)],
  detailValues: [textField('Title', ' A & B ')], checked: [textField('Selector', 'head > title')],
  markup: [originalField('<title>', markup)], references: ['https://html.spec.whatwg.org/'],
})
const result = () => ({ name: 'Page title', label: 'HEAD', message: 'Title elements: 1', type: 'ok' as const, ruleId: 'head-title', priority: 1000, runIndex: 2, presentation: view() })

describe('presentation contract', () => {
  it('preserves all references and only falls back when none exist', () => {
    expect(createPresentation({ ...view(), references: [] }).references).toEqual(['https://fullstackoptimization.com/'])
    expect(createPresentation({ ...view(), references: ['https://one.test/', 'https://two.test/'] }).references).toHaveLength(2)
    expect(() => createPresentation({ ...view(), references: ['javascript:alert(1)'] })).toThrow()
    expect(() => createPresentation({ ...view(), references: [''] })).toThrow()
  })
  it('rejects dumps, missing keys, incomplete originals and advice payloads', () => {
    for (const field of [{ key: '', kind: 'text', value: 0 }, { key: 'Robots', kind: 'text', value: { noindex: true } },
      { key: 'Markup', kind: 'original', value: '<h1>…' }, { key: 'Markup', kind: 'original', fidelity: 'excerpt', value: '<h1>…' }]) {
      expect(presentationSchema.safeParse({ ...view(), values: [field] }).success).toBe(false)
    }
    expect(presentationSchema.safeParse({ ...view(), interpretation: 'You should improve this title' }).success).toBe(false)
  })
  it('retains the native complete DOM serialization and distinguishes reconstructed documents', () => {
    const doc = new JSDOM('<h1 class="title" data-original="yes"> A <em lang="de">B</em> </h1>').window.document
    const element = doc.querySelector('h1')!
    expect(readOriginalMarkup(element)?.html).toBe(element.outerHTML)
    expect(markupEvidence([element]).markup[0].value).toContain('<em lang="de">B</em>')
    markReconstructed(doc)
    expect(readOriginalMarkup(element)).toBeNull()
    registerOriginal(element, { html: markup, selector: '#original-title' })
    expect(readOriginalMarkup(element)).toEqual({ html: markup, selector: '#original-title' })
  })
  it('rejects overlarge native captures instead of disguising shortened HTML as original', () => {
    const doc = new JSDOM(`<h1>${'x'.repeat(9000)}</h1><template>${'y'.repeat(9000)}</template>`).window.document
    expect(readOriginalMarkup(doc.querySelector('h1')!)).toBeNull()
    expect(readOriginalMarkup(doc.querySelector('template')!)).toBeNull()
  })
  it('preserves original values across transport or omits whole fields with a reason', () => {
    expect(boundResult(result()).presentation).toEqual(view())
    const long = { ...view(), markup: [originalField('Markup 1', '漢字'.repeat(8000))] }
    const bounded = boundPresentation(long)
    expect(bounded.markup).toEqual([])
    expect(bounded.values).toEqual(view().values)
    expect(bounded.noMarkup).toContain('storage capacity')
    const hugeValue = boundPresentation({ ...long, values: [originalField('<title>', '漢字'.repeat(8000))] })
    expect(hugeValue.values.every((field) => field.kind !== 'original')).toBe(true)
    expect(presentationSchema.safeParse(bounded).success).toBe(true)
  })
  it('keeps as many whole records as fit instead of dropping every record', () => {
    const link = (index: number) => `<link rel="alternate" hreflang="l${index}" href="https://www.example.test/${'p'.repeat(200)}/${index}">`
    const many = { ...view(), markup: Array.from({ length: 137 }, (_, index) => originalField(`Link ${index + 1}`, link(index))),
      evidence: Array.from({ length: 137 }, (_, index) => ({ name: `Hreflang ${index + 1}`, fields: [textField('Language', `l${index}`)] })) }
    const bounded = boundPresentation(many)
    expect(bounded.markup.length).toBeGreaterThan(40)
    expect(bounded.markup.length).toBeLessThan(137)
    expect(bounded.markup).toEqual(many.markup.slice(0, bounded.markup.length))
    expect(bounded.detailValues).toContainEqual(textField('Markup omitted', 137 - bounded.markup.length))
    expect(bounded.detailValues).toContainEqual(textField('Markup retained', bounded.markup.length))
    expect(presentationSchema.safeParse(bounded).success).toBe(true)
  })
  it('copies extracted title, full markup, references and labelled technical metadata', () => {
    const copy = presentationCopy(result())
    for (const expected of [markup, 'Title:  A & B ', 'Rule ID: head-title', 'Run position: 2', 'Sort priority: 1000', 'Reference: https://html.spec.whatwg.org/']) expect(copy).toContain(expected)
    expect(copy).not.toContain('[object Object]')
  })
  it('renders extracted title as text and exact complete markup as a labelled field', () => {
    const html = renderToStaticMarkup(<PresentationCard result={result()} defaultExpanded isPinned />)
    const doc = new JSDOM(html).window.document
    expect(doc.querySelector('textarea')?.value).toBe(markup)
    expect(doc.querySelectorAll('textarea')).toHaveLength(1)
    expect(doc.querySelector('[aria-label="Extracted values"]')?.textContent).toBe('Title: A & B ')
    expect(doc.querySelector('[aria-label="Extracted values"] textarea')).toBeNull()
    expect(doc.querySelector('[data-reference-url]')?.className).toContain('underline')
    expect(doc.querySelector('[aria-label="Passed"]')).toBeTruthy()
    expect(doc.querySelector('[aria-label="Favorited"]')).toBeTruthy()
    expect(doc.body.textContent).not.toContain('Check passed')
    expect(doc.querySelector('label')?.htmlFor).toBe(doc.querySelector('textarea')?.id)
  })
  it('keeps not applicable separate in filters, counts and labels', () => {
    expect(resultTypeOrder).toContain('not_applicable')
    expect(getResultLabel('not_applicable')).toBe('Not applicable')
    expect(createDefaultTypeVisibility().not_applicable).toBe(true)
    expect(countResultTypes([{ ...result(), type: 'not_applicable' }]).not_applicable).toBe(1)
  })
})
