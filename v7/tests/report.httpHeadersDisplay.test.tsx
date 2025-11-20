import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'

import { DetailsView } from '@/report/DetailsView'

describe('DetailsView httpHeaders display', () => {
  it('renders headers payload when provided', () => {
    const details = {
      httpHeaders: { 'content-type': 'text/html', server: 'nginx' },
      reference: 'https://developer.mozilla.org/docs/Web/HTTP/Headers',
      tested: 'Rendered httpHeaders block for UI smoke test.',
    }
    const html = renderToString(<DetailsView details={details} />)
    expect(html).toContain('httpHeaders')
    expect(html).toContain('content-type')
    expect(html).toContain('nginx')
  })

  it('renders empty state for missing headers object', () => {
    const details = {
      httpHeaders: {},
      reference: 'https://developer.mozilla.org/docs/Web/HTTP/Headers',
      tested: 'Rendered httpHeaders empty slate.',
    }
    const html = renderToString(<DetailsView details={details} />)
    expect(html).toContain('No headers available')
  })
})
