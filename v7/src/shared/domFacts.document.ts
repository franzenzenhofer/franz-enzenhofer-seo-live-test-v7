import type { DomElementFact, DomPhaseFacts } from './domFacts.types'

const appendFact = (doc: Document, fact: DomElementFact) => {
  const element = doc.createElement(fact.tag)
  for (const [name, value] of fact.attrs) {
    try { element.setAttribute(name, value) } catch { /* ignore invalid page attributes */ }
  }
  if (fact.text) element.textContent = fact.text
  const parent = fact.location === 'head' ? doc.head : doc.body
  parent?.appendChild(element)
}

export const domFactsToDocument = (
  facts: DomPhaseFacts,
  makeDoc: (markup: string) => Document,
) => {
  const doc = makeDoc('')
  for (const [name, value] of facts.documentAttributes) {
    try { doc.documentElement.setAttribute(name, value) } catch { /* ignore invalid page attributes */ }
  }
  facts.elements.forEach((fact) => appendFact(doc, fact))
  const hrefs = new Set(facts.elements.flatMap((fact) => fact.attrs.filter(([name]) => name === 'href').map(([, value]) => value)))
  facts.parameterizedLinks.forEach((href) => {
    if (hrefs.has(href)) return
    appendFact(doc, { location: 'body', tag: 'a', attrs: [['href', href]] })
  })
  return doc
}
