// Documentation URLs retained from the registered rules.
export const ruleReferences = {
  "discover:article-structured-data": [
    "https://developers.google.com/search/docs/appearance/structured-data/article",
    "https://developers.google.com/search/docs/appearance/google-discover"
  ],
  "head:brand-in-title": [
    "https://developers.google.com/search/docs/appearance/title-link"
  ],
  "body:h1": [
    "https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines-2",
    "https://developers.google.com/search/docs/fundamentals/seo-starter-guide"
  ],
  "discover:max-image-preview-large": [
    "https://developers.google.com/search/docs/appearance/google-discover",
    "https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag"
  ],
  "discover:og-image-large": [
    "https://developers.google.com/search/docs/appearance/google-discover",
    "https://ogp.me/"
  ],
  "body:parameterized-links": [
    "https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation",
    "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls"
  ],
  "http:mixed-content": [
    "https://www.w3.org/TR/mixed-content/"
  ],
  "http:navigation-path": [
    "https://developers.google.com/search/docs/crawling-indexing/301-redirects",
    "https://developer.chrome.com/docs/lighthouse/performance/redirects",
    "https://www.rfc-editor.org/rfc/rfc9110.html#name-redirection-3xx"
  ],
  "head-title": [
    "https://developers.google.com/search/docs/appearance/title-link",
    "https://html.spec.whatwg.org/multipage/semantics.html#the-title-element"
  ],
  "body:unsecure-input": [
    "https://www.chromium.org/Home/chromium-security/marking-http-as-non-secure/",
    "https://developer.mozilla.org/en-US/docs/Web/Security/Insecure_passwords"
  ]
}
export const referencesFor = item => item.references?.length ? item.references : ['https://fullstackoptimization.com/']
