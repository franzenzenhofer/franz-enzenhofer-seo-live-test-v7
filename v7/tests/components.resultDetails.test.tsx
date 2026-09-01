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

  it('renders measurements as compact rows, not full-width pre blocks', () => {
    const html = renderToStaticMarkup(
      <ResultDetails details={{ count: 12, length: 58, hasNoindex: false, status: 200 }} />,
    )
    expect(html).toContain('detail-measurements')
    expect(html).toContain('<dl')
    expect(html).not.toContain('<pre')
    expect(html).toContain('HAS NOINDEX')
    expect(html).toContain('no')
  })

  it('folds technical payloads away and keeps the spec link as a footer', () => {
    const html = renderToStaticMarkup(
      <ResultDetails
        details={{
          httpHeaders: { server: 'Apache', vary: 'Origin' },
          highlightSelectors: ['html > head > meta:nth-of-type(26)'],
          reference: 'https://example.spec/doc',
          tested: 'Checked the rendered DOM.',
        }}
      />,
    )
    expect(html).toContain('<details')
    expect(html).toContain('server: Apache')
    expect(html).toContain('detail-provenance')
    expect(html).toContain('href="https://example.spec/doc"')
    expect(html).toContain('Checked the rendered DOM.')
    expect(html).not.toContain('>REFERENCE<')
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

  it('drops a short measurement that repeats the evidence value', () => {
    const tiers = tierDetails({ title: 'Short page title' }, 'Short page title')
    expect(tiers.evidence).toHaveLength(1)
    expect(tiers.measurements).toHaveLength(0)
  })

  it('never repeats a value the verdict message already quotes in full', () => {
    const title = 'Stocker mit Plan fuer das Zukunftsdepot'
    const tiers = tierDetails({ title }, `<title>${title}</title>`, `Title (39 chars): "${title}"`)
    expect(tiers.evidence).toHaveLength(0)
    const fuller = tierDetails({ description: 'A very long value where the message only quoted the first part of it' }, null, 'Description: "A very long value where the…"')
    expect(fuller.evidence).toHaveLength(1)
  })

  it('renders nothing at all for empty details', () => {
    expect(renderToStaticMarkup(<ResultDetails details={{}} />)).toBe('')
    expect(renderToStaticMarkup(<ResultDetails />)).toBe('')
  })
})
