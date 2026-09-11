import { parseRobotsDirectives } from '@/shared/robots'
import type { RobotsDirective } from '@/shared/robots.types'
import { isRobotsMetaDirective } from '@/shared/robotsVocabulary'

// Robots meta directives carry no element reference (robots.ts stores only a
// domPath/sourceHtml string). To attach original-data markup with the fidelity
// the presentation contract requires, re-select the same meta[name] elements
// with the same isRobotsMetaDirective predicate parseMeta uses internally -
// both iterate doc.querySelectorAll('meta[name]') in document order, so the
// filtered directive list and filtered element list line up 1:1 by index.
export type RobotsMetaPair = { directive: RobotsDirective; element: Element }

const metaElements = (doc: Document): Element[] =>
  Array.from(doc.querySelectorAll('meta[name]')).filter((el) => {
    const name = (el.getAttribute('name') || '').trim().toLowerCase()
    const content = (el.getAttribute('content') || '').trim()
    return content !== '' && isRobotsMetaDirective(name, content)
  })

export const robotsMetaPairs = (doc: Document): RobotsMetaPair[] => {
  const directives = parseRobotsDirectives(doc).filter((directive) => directive.source === 'meta')
  const elements = metaElements(doc)
  const pairs: RobotsMetaPair[] = []
  directives.forEach((directive, index) => {
    const element = elements[index]
    if (element) pairs.push({ directive, element })
  })
  return pairs
}
