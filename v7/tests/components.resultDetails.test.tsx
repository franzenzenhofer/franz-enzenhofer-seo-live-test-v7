import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ResultDetails } from '@/components/result/ResultDetails'
import { tierDetails } from '@/components/result/detailTiers'

const count = (html: string, needle: string): number => html.split(needle).length - 1

const description = 'A long meta description that explains what the article is about, well past the one-line threshold so it counts as evidence.'

describe('ResultDetails tiers', () => {
  it('shows the judged value exactly once - snippet, semantic key and sourceHtml collapse into one box', () => {
    const html = renderToStaticMarkup(
      <ResultDetails
        snippet={description}
        details={{
          description,
          sourceHtml: `<meta name="description" content="${description.slice(0, 80)}">`,
          reference: 'https://developers.google.com/search/docs',
        }}
      />,
    )
    expect(count(html, 'well past the one-line threshold')).toBe(1)
    expect(html).not.toContain('detail-source')
    expect(count(html, 'detail-evidence')).toBe(1)
  })

  it('renders measurements as compact labelled rows, not full-width boxes', () => {
    const html = renderToStaticMarkup(
      <ResultDetails details={{ count: 12, length: 58, hasNoindex: false, status: 200 }} />,
    )
    expect(html).toContain('detail-measurements')
    expect(html).toContain('Has noindex:')
    expect(html).toContain('no')
    expect(html).not.toContain('HAS NOINDEX')
    expect(count(html, 'detail-evidence')).toBe(0)
  })

  it('renders technical payloads flat - no fold-outs inside the expanded card', () => {
    const html = renderToStaticMarkup(
      <ResultDetails details={{ httpHeaders: { server: 'Apache', vary: 'Origin' }, highlightSelectors: ['html > head > meta'] }} />,
    )
    expect(html).toContain('detail-technical')
    expect(html).toContain('server: Apache')
    expect(html).toContain('html &gt; head &gt; meta')
    expect(html).not.toContain('<details')
  })

  it('shows the reference as its address with the domain visible, never a bare label', () => {
    const url = 'https://developers.google.com/search/docs/crawling-indexing/supported-tags#meta-descriptions'
    const html = renderToStaticMarkup(<ResultDetails details={{ reference: url, tested: 'Checked the rendered DOM.' }} />)
    expect(html).toContain('detail-provenance')
    expect(html).toContain(`href="${url}"`)
    expect(html).toContain('developers.google.com/…/supported-tags#meta-descriptions')
    expect(html).toContain('Checked the rendered DOM.')
    expect(html).not.toContain('>Reference<')
  })

  it('gives diagnosis and remedy their own tier above measurements, with the fix emphasised', () => {
    const html = renderToStaticMarkup(
      <ResultDetails details={{ is: 'dateModified missing', should: 'Add dateModified to article schema', count: 2 }} />,
    )
    const guidanceAt = html.indexOf('detail-guidance')
    const measurementsAt = html.indexOf('detail-measurements')
    expect(guidanceAt).toBeGreaterThan(-1)
    expect(guidanceAt).toBeLessThan(measurementsAt)
    expect(html).toContain('Problem:')
    expect(html).toContain('Fix:')
    expect(html).toContain('Add dateModified to article schema')
    expect(html).not.toContain('Is:')
  })

  it('never renders below the 12px scale', () => {
    const html = renderToStaticMarkup(
      <ResultDetails
        snippet={description}
        details={{ is: 'x missing', should: 'add x', count: 1, sourceHtml: '<link href="https://a.example/b/c/d">', httpHeaders: { a: 'b' }, reference: 'https://a.example/b' }}
      />,
    )
    expect(html).not.toMatch(/text-\[\d+px\]/)
  })

  it('renders an array of {url, status} results as one full line per hop, never JSON', () => {
    const redirectChain = [
      { url: 'https://orf.at/stories/3440788/fake-url-for-soft-404-check', status: 301, location: 'https://newsv2.orf.at/stories/3440788' },
      { url: 'https://newsv2.orf.at/stories/3440788', status: 404 },
    ]
    const tiers = tierDetails({ redirectChain })
    expect(tiers.evidence[0]?.text).toBe(
      'https://orf.at/stories/3440788/fake-url-for-soft-404-check  301\nhttps://newsv2.orf.at/stories/3440788  404',
    )
  })

  it('keeps long values complete in the expanded view - no truncation, no ellipsis', () => {
    const robotsTxt = `User-agent: *\n${Array.from({ length: 40 }, (_, i) => `Disallow: /private-${i}/`).join('\n')}`
    const html = renderToStaticMarkup(<ResultDetails details={{ robotsTxt }} />)
    expect(html).toContain('/private-39/')
    expect(html).not.toContain('…</')
  })

  it('keeps sourceHtml when it says more than the evidence', () => {
    const html = renderToStaticMarkup(
      <ResultDetails snippet="Page title" details={{ sourceHtml: '<link rel="canonical" href="https://example.com/page">' }} />,
    )
    expect(html).toContain('detail-source')
    expect(html).toContain('rel=')
  })

  it('prefers the fuller value: a snippet contained in the whole file is not shown twice', () => {
    const start = 'User-agent: *\nDisallow: /private/'
    const robotsTxt = `${start}\nSitemap: https://example.com/sitemap.xml`
    const tiers = tierDetails({ robotsTxt }, start)
    expect(tiers.evidence).toHaveLength(1)
    expect(tiers.evidence[0]?.text).toBe(robotsTxt)
  })

  it('renders arrays as one line per item, never raw JSON', () => {
    const directives = [
      { ua: 'robots', source: 'meta', value: 'index, follow', sourceHtml: '<meta name="robots">' },
      { ua: 'googlebot', source: 'meta', value: 'noarchive', sourceHtml: '<meta name="googlebot">' },
    ]
    const tiers = tierDetails({ directives })
    expect(tiers.evidence[0]?.text).toBe('robots: index, follow\ngooglebot: noarchive')
  })

  it('always keeps the value box, even when the verdict message quotes the value', () => {
    const title = 'Stocker mit Plan fuer das Zukunftsdepot'
    const tiers = tierDetails({ title }, `<title>${title}</title>`)
    expect(tiers.evidence).toHaveLength(1)
  })

  it('drops a short measurement that repeats the evidence value', () => {
    const tiers = tierDetails({ title: 'Short page title' }, 'Short page title')
    expect(tiers.evidence).toHaveLength(1)
    expect(tiers.measurements).toHaveLength(0)
  })

  it('renders nothing at all for empty details', () => {
    expect(renderToStaticMarkup(<ResultDetails details={{}} />)).toBe('')
    expect(renderToStaticMarkup(<ResultDetails />)).toBe('')
  })
})
