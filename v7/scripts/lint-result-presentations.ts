import assert from 'node:assert/strict'

import { JSDOM } from 'jsdom'

import { registry } from '../src/rules/registry'
import { presentationSchema } from '../src/shared/presentation/schema'
import { referenceUrls } from '../src/shared/presentation/create'
import { presentationCopy } from '../src/shared/presentation/copy'
import { boundResult } from '../src/shared/boundResult'
import { resultTypeOrder } from '../src/shared/colors'

const fixtures = [
  { name: 'absent', html: '', url: 'https://example.test/' },
  { name: 'present', url: 'https://example.test/', html: '<title lang="en" data-capture="all-attributes"> Example &amp; title </title><meta name="description" content="Description"><meta name="robots" content="max-image-preview:large"><meta property="og:image" content="/photo.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><h1 class="hero">Hello <em lang="de">world</em></h1><a href="/trips?q=a&amp;page=2">Trips</a><script type="application/ld+json">{"@graph":[{"@type":"Article"},{"@type":"Organization"}]}</script>' },
  { name: 'duplicates-empty', url: 'http://example.test/', html: '<title> </title><title>Other</title><meta name="description" content=""><meta name="description" content="Other"><h1> </h1><h1>Two</h1><input type="password" autocomplete="current-password"><meta name="robots" content="max-image-preview:none, noimageindex">' },
  { name: 'malformed', url: 'https://example.test/', html: '<title>😀</title><h1> </h1><meta property="og:image" content="/image"><meta property="og:image:width" content="1200garbage"><script type="application/ld+json">broken</script>' },
  { name: 'unknown-url', url: 'invalid URL', html: '<title>Unmatched brand</title>' },
  { name: 'large-capture', url: 'https://example.test/', html: `<title data-template="seo">${'漢字'.repeat(6000)}</title>` },
]
const forbidden = /^(fix|should|advice|interpretation|next ?step|what (it|this) means|recommendation)$/i
const migrated = registry.filter((rule) => rule.presentation === 1)
let checked = 0
for (const rule of migrated) {
  for (const fixture of fixtures) {
    const doc = new JSDOM(fixture.html).window.document
    const originalValues = new Set(Array.from(doc.querySelectorAll('*'), (node) => node.outerHTML))
    const result = await rule.run({ html: fixture.html, doc, url: fixture.url, headers: {} }, { globals: {} })
    const prefix = `${rule.id} / ${fixture.name}`
    const view = presentationSchema.parse(result.presentation)
    assert.equal(view.name, rule.name, `${prefix}: speaking name differs`)
    assert.equal(view.pageUrl, fixture.url, `${prefix}: tested URL missing`)
    assert.deepEqual(view.references, referenceUrls(rule.meta.references), `${prefix}: lost or replaced references`)
    assert(resultTypeOrder.includes(result.type), `${prefix}: unknown state`)
    assert.equal(result.details, undefined, `${prefix}: migrated rule still emits legacy details`)
    const fields = [...view.values, ...view.detailValues, ...view.checked, ...view.markup, ...view.evidence.flatMap((record) => record.fields)]
    for (const field of fields) {
      assert(!forbidden.test(field.key), `${prefix}: advice label ${field.key}`)
      if (field.kind === 'original') assert(originalValues.has(field.value), `${prefix}: original field is not a complete retrieved element`)
    }
    const bounded = boundResult(result)
    presentationSchema.parse(bounded.presentation)
    for (const field of [...bounded.presentation!.values, ...bounded.presentation!.detailValues, ...bounded.presentation!.markup, ...bounded.presentation!.evidence.flatMap((record) => record.fields)]) {
      if (field.kind === 'original') assert(originalValues.has(field.value), `${prefix}: transport changed original data`)
    }
    const copy = presentationCopy(bounded)
    assert(!copy.includes('[object Object]'), `${prefix}: object dump in copied result`)
    for (const url of view.references) assert(copy.includes(url), `${prefix}: copied result lost a reference`)
    checked++
  }
}
console.log(`Presentation lint passed: ${migrated.length} manually migrated rules, ${checked} fixture executions.`)
