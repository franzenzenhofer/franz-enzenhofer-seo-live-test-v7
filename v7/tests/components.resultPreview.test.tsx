import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { ResultPreview } from '@/components/result/ResultPreview'

describe('ResultPreview', () => {
  it('renders the judged value', () => {
    const html = renderToStaticMarkup(<ResultPreview details={{ title: 'Stocker mit Plan' }} />)
    expect(html).toContain('Stocker mit Plan')
    expect(html).toContain('result-preview')
  })

  it('renders nothing when there is no value to show', () => {
    expect(renderToStaticMarkup(<ResultPreview details={{ reference: 'https://x.test' }} />)).toBe('')
  })

  it('yields entirely to a verdict message that already carries the value', () => {
    const h1 = 'Stocker mit Plan für „Zukunftsdepot“'
    expect(renderToStaticMarkup(<ResultPreview details={{ h1 }} message={`1 <h1> found: "${h1}"`} />)).toBe('')
  })

  it('yields to a message that quotes a truncated form of the value', () => {
    const value = 'A long description the verdict message can only quote the beginning of before running out of room'
    expect(renderToStaticMarkup(<ResultPreview details={{ description: value }} message={`Meta description: "${value.slice(0, 40)}…"`} />)).toBe('')
  })

  it('still renders when the message says something else', () => {
    const html = renderToStaticMarkup(<ResultPreview details={{ title: 'Stocker mit Plan' }} message="Title set." />)
    expect(html).toContain('Stocker mit Plan')
  })

  it('offers the full value for copying even though the display is cut', () => {
    const value = `${'x'.repeat(200)} tail-marker`
    const html = renderToStaticMarkup(<ResultPreview details={{ description: value }} />)
    expect(html).toContain('…')
    expect(html).not.toContain('tail-marker')
  })
})
