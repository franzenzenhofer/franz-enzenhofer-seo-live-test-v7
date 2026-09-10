import { ruleReferences } from './references.mjs'
const title = 'Kyrgyzstan: Trekking the Tien Shan Trails'
const titleMarkup = '<title data-template="trip" lang="en">Kyrgyzstan: Trekking the Tien Shan Trails</title>'
const h1Markup = '<h1 class="trip-title" id="trip-title">Kyrgyzstan: Trekking the Tien Shan Trails</h1>'
const imageUrl = 'https://legacy.example.com/partner-trips/image-thumb__160337__detailHeader/883577724446@2x.jpg?v=1788994399'
export const pageUrl = 'https://example.test/trips/kyrgyzstan'
export const fixtures = [
  {
    id: 'head:brand-in-title', input: 'Static DOM + page hostname', name: 'Brand in page title', status: 'warn',
    values: [['Brand match', 'Not found'], ['Searched brand', 'example'], ['<title>', titleMarkup, 'markup', 'complete-original']],
    detailValues: [['Title', title]],
    checked: [['Selector', 'head > title'], ['Brand', 'example'], ['Brand source', 'Hostname estimate'], ['Match', 'Case-insensitive substring in <title>']],
    sources: [titleMarkup],
  },
  {
    id: 'head-title', input: 'Static DOM', name: 'Page title', status: 'pass',
    values: [['Title elements', '1'], ['<title>', titleMarkup, 'markup', 'complete-original']],
    detailValues: [['Title', title]],
    checked: [['Selector', 'head > title'], ['Criterion', 'Exactly one element with non-empty text']],
    facts: [['Title elements', '1'], ['Characters', String(title.length)]],
    sources: [titleMarkup],
  },
  {
    id: 'body:h1', input: 'Static DOM', name: 'H1 headings', status: 'pass',
    values: [['H1 elements', '1'], ['<h1>', h1Markup, 'markup', 'complete-original']],
    checked: [['Selector', 'h1'], ['Criterion', 'At least one heading with non-empty text']],
    sources: [h1Markup],
  },
  {
    id: 'http:mixed-content', input: 'Idle DOM + page URL', name: 'Resources with HTTP URLs', status: 'fail',
    values: [['HTTP resource references', '2']],
    checked: [['Page protocol', 'HTTPS'], ['Attributes', 'src, srcset, href and poster on resource elements'], ['Criterion', 'No resource URL uses http:']],
    evidence: [
      { name: 'Image 1', fields: [['Alt text', 'Alpe-Adria 8 Tage'], ['Resource URL', 'http://images.example.test/alpe-adria.jpg?v=1'], ['Attribute', 'src'], ['CSS selector', '#trip-grid > article:nth-child(1) img']] },
      { name: 'Image 2', fields: [['Alt text', 'Lanzarote Vulkaninsel'], ['Resource URL', 'http://images.example.test/lanzarote.jpg?v=2'], ['Attribute', 'src'], ['CSS selector', '#trip-grid > article:nth-child(2) img']] },
    ],
    sources: ['<img src="http://images.example.test/alpe-adria.jpg?v=1" alt="Alpe-Adria 8 Tage">', '<img src="http://images.example.test/lanzarote.jpg?v=2" alt="Lanzarote Vulkaninsel">'],
  },
  {
    id: 'body:parameterized-links', input: 'Static DOM', name: 'Links with URL parameters', status: 'info',
    values: [['Matching links', '2 of 24']],
    checked: [['Selector', 'a[href]'], ['Match', 'href contains a query string']],
    evidence: [
      { name: 'Link 1', fields: [['Link text', 'Cycling holidays'], ['URL', '/trips?activity=cycling'], ['Parameters', 'activity=cycling'], ['CSS selector', '#filters a']] },
      { name: 'Link 2', fields: [['Link text', 'Next page'], ['URL', '/trips?page=2'], ['Parameters', 'page=2'], ['CSS selector', 'nav[aria-label="Pagination"] a']] },
    ],
    sources: ['<a href="/trips?activity=cycling">Cycling holidays</a>', '<a href="/trips?page=2">Next page</a>'],
  },
  {
    id: 'body:unsecure-input', input: 'Page URL', name: 'Password fields on HTTP pages', status: 'na',
    values: [['Applicable', 'No — page uses HTTPS']],
    noMarkup: 'None — page URL checked; password fields not checked',
    checked: [['Page protocol', 'HTTPS'], ['Run condition', 'Page URL uses HTTP'], ['Password fields', 'Not checked']],
  },
  {
    id: 'discover:max-image-preview-large', input: 'Idle DOM + HTTP response headers', name: 'Large image preview permission', status: 'warn',
    values: [['max-image-preview', 'Not declared']],
    checked: [['DOM selector', 'meta[name="robots"], meta[name="googlebot"]'], ['Header', 'X-Robots-Tag'], ['Crawler', 'Googlebot'], ['Inputs', 'Applicable robots meta tags and X-Robots-Tag headers'], ['Criterion', 'max-image-preview:large']],
    facts: [['Robots meta', 'index, follow'], ['Googlebot meta', 'Not present'], ['X-Robots-Tag', 'Not present']],
    sources: ['<meta name="robots" content="index, follow">'],
  },
  {
    id: 'discover:og-image-large', input: 'Idle DOM', name: 'Open Graph image dimensions', status: 'warn',
    values: [['Declared dimensions', '1024 × 576 px']],
    checked: [['DOM selector', 'meta[property^="og:image"]'], ['Input', 'og:image:width and og:image:height for this image'], ['Width criterion', 'At least 1200 px'], ['Area criterion', 'More than 300,000 px²']],
    facts: [['Image URL', imageUrl], ['Declared width', '1024 px'], ['Declared height', '576 px'], ['Calculated area', '589,824 px²'], ['Image file dimensions', 'Not measured']],
    sources: [`<meta property="og:image" content="${imageUrl}">\n<meta property="og:image:width" content="1024">\n<meta property="og:image:height" content="576">`],
  },
  {
    id: 'discover:article-structured-data', input: 'Idle DOM', name: 'Article structured data', status: 'info',
    values: [['Matching entities', '0']],
    checked: [['Selector', 'script[type="application/ld+json"]'], ['Format', 'JSON-LD'], ['Types', 'Article, NewsArticle, BlogPosting']],
    facts: [['Scripts checked', '2'], ['Parse errors', '0'], ['Types found', 'Organization, BreadcrumbList']],
    sources: ['<script type="application/ld+json">{"@type":"Organization","name":"Example Travel"}</script>', '<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[]}</script>'],
  },
  {
    id: 'http:navigation-path', input: 'Navigation events', name: 'Page navigation', status: 'info',
    noMarkup: 'None — navigation events checked',
    values: [['HTTP redirects', '1'], ['Final response', '200 OK']],
    checked: [['Input', 'Captured main-document navigation events']],
    evidence: [
      { name: 'Request 1', fields: [['URL', 'https://example.test/old-trip'], ['Response', '308 Permanent Redirect'], ['Location', pageUrl]] },
      { name: 'Request 2', fields: [['URL', pageUrl], ['Response', '200 OK']] },
    ],
  },
  {
    id: 'demo:pending', input: 'Not available yet', name: 'HTTP response status', status: 'pending',
    values: [['Execution', 'Checking…']], checked: [['Requested input', 'Main-document HTTP response']],
    noMarkup: 'None — response pending',
  },
  {
    id: 'demo:unavailable', input: 'Not received', name: 'HTTP response status', status: 'unavailable',
    values: [['Execution', 'Not checked'], ['Response headers', 'Not captured']],
    checked: [['Requested input', 'Main-document HTTP response']], noMarkup: 'None retrieved',
  },
  {
    id: 'demo:disabled', input: 'Not checked', name: 'Canonical link', status: 'disabled',
    values: [['Execution', 'Disabled']], checked: [['Configured input', 'Static DOM']],
    noMarkup: 'None — rule did not run',
  },
  {
    id: 'demo:title-excerpt', input: 'Static DOM (partial capture)', name: 'Page title · Partial capture', status: 'unavailable',
    values: [['Execution', 'Partial capture'], ['<title>', '<title data-template="trip" lang="en">Kyrgyzstan…', 'markup', 'excerpt']],
    checked: [['Selector', 'head > title'], ['Criterion', 'Exactly one element with non-empty text']],
    noMarkup: 'Complete markup not captured',
  },
].map((fixture, index) => ({
  ...fixture,
  references: ruleReferences[fixture.id] || [],
  sourceIntegrity: fixture.sources ? 'complete-original' : undefined,
  runPosition: index + 1,
  sortPriority: [100, 1000, 1000, 80, 700, 900, 400, 400, 800, 700, null, null, -3000, null][index],
}))
