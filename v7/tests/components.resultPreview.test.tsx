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

  it('always renders the value box, even when the verdict message quotes the value', () => {
    const h1 = 'Stocker mit Plan für „Zukunftsdepot“'
    const html = renderToStaticMarkup(<ResultPreview details={{ h1 }} />)
    expect(html).toContain('Stocker mit Plan')
    expect(html).toContain('result-preview')
  })

  it('offers the full value for copying even though the display is cut', () => {
    const value = `${'x'.repeat(200)} tail-marker`
    const html = renderToStaticMarkup(<ResultPreview details={{ description: value }} />)
    expect(html).toContain('…')
    expect(html).not.toContain('tail-marker')
  })
})
