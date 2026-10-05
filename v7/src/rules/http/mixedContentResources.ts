import type { Page } from '@/core/types'
import type { ResourceIssue } from '@/shared/resourceIssues'

/** An offender: its issue facts plus the source element when it came from the DOM (network-only offenders have none). */
export type Offender = { issue: ResourceIssue; element?: Element }

// Only fetching link relations: https://www.w3.org/TR/mixed-content/
const FETCHING_RELATIONS = new Set(['stylesheet', 'icon', 'preload', 'prefetch', 'modulepreload', 'manifest'])
const ATTRIBUTES: Record<string, string> = {
  script: 'src', link: 'href', img: 'src', iframe: 'src', video: 'src',
  audio: 'src', source: 'src', embed: 'src', object: 'data', form: 'action',
}
const KINDS: Record<string, string> = {
  script: 'Script', link: 'Linked resource', img: 'Image', iframe: 'Frame',
  video: 'Video', audio: 'Audio', source: 'Media source', embed: 'Embedded resource',
  object: 'Object', form: 'Form',
}
const isHttp = (url: string): boolean => /^http:\/\//i.test(url.trim())
const cssString = (value: string): string => value.replace(/[\\"\n\r\f]/g, (char) => `\\${char.codePointAt(0)!.toString(16)} `)
const fileName = (url: string): string => {
  try {
    const parsed = new URL(url)
    return decodeURIComponent(parsed.pathname.split('/').pop() || parsed.hostname)
  } catch { return url }
}

const elementIssue = (element: Element): ResourceIssue[] => {
  const tag = element.tagName.toLowerCase()
  const attribute = ATTRIBUTES[tag]
  if (!attribute) return []
  const relations = (element.getAttribute('rel') || '').toLowerCase().split(/\s+/)
  if (tag === 'link' && !relations.some((rel) => FETCHING_RELATIONS.has(rel))) return []
  const rawUrl = element.getAttribute(attribute) || ''
  if (!isHttp(rawUrl)) return []
  const url = rawUrl.trim()
  const name = ['alt', 'aria-label', 'title', 'id', 'name']
    .map((key) => element.getAttribute(key)?.trim()).find(Boolean) || fileName(url)
  return [{
    name, kind: tag === 'link' && relations.includes('stylesheet') ? 'Stylesheet' : KINDS[tag]!,
    url, location: `<${tag}> ${attribute}`,
    // Attribute selectors also work on the real page when this DOM is a compact fact document.
    selector: `${tag}[${attribute}="${cssString(rawUrl)}"]`,
  }]
}

// Every DOM offender paired with its source element, so the card can retrieve original markup.
const elementOffenders = (page: Page): Offender[] =>
  Array.from(page.doc.querySelectorAll(Object.keys(ATTRIBUTES).join(',')))
    .flatMap((element) => elementIssue(element).map((issue) => ({ element, issue })))

/** DOM and network-only HTTP resource offenders, and HTTP form actions, in page order. */
export const mixedContentOffenders = (page: Page): { resources: Offender[]; forms: Offender[] } => {
  const offenders = elementOffenders(page)
  const forms = offenders.filter((offender) => offender.issue.kind === 'Form')
  const elements = offenders.filter((offender) => offender.issue.kind !== 'Form')
  const elementUrls = new Set(elements.map((offender) => offender.issue.url))
  const network = [...new Set((page.resources || []).filter(isHttp).map((url) => url.trim()))]
    .filter((url) => !elementUrls.has(url))
    .map((url): Offender => ({ issue: { name: fileName(url), kind: 'Network resource', url, location: 'Network capture; no matching HTML element found' } }))
  return { resources: [...elements, ...network], forms }
}

/** "2 images, 1 script": one derived observed value for the overview (F12). */
export const kindSummary = (offenders: Offender[]): string[] => {
  const counts = offenders.reduce<Record<string, number>>((all, { issue }) => ({ ...all, [issue.kind]: (all[issue.kind] || 0) + 1 }), {})
  return Object.entries(counts).map(([kind, count]) => `${count} ${kind.toLowerCase()}${count === 1 ? '' : 's'}`)
}
