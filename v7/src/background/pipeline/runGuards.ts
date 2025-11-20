import type { Run } from './types'

export const hasNavAfterDom = (run: Run) => {
  let lastNav = -1
  let lastDom = -1
  run.ev.forEach((e, i) => {
    if (e.t.startsWith('nav:')) lastNav = i
    if (e.t.startsWith('dom:')) lastDom = i
  })
  return lastNav !== -1 && lastDom !== -1 && lastNav > lastDom
}
