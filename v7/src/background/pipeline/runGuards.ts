import type { Run } from './types'

// Only a document navigation (nav:before / nav:commit) invalidates a captured
// DOM. A history update (nav:history) never reaches a record after its DOM
// phases: a different URL replaces the record (softNavigation.ts) and the same
// URL is a mere address rewrite of the captured page.
const DOCUMENT_NAV = new Set(['nav:before', 'nav:commit'])

export const hasNavAfterDom = (run: Run) => {
  let lastNav = -1
  let lastDom = -1
  run.ev.forEach((e, i) => {
    if (DOCUMENT_NAV.has(e.t)) lastNav = i
    if (e.t.startsWith('dom:')) lastDom = i
  })
  return lastNav !== -1 && lastDom !== -1 && lastNav > lastDom
}
