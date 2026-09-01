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
})
