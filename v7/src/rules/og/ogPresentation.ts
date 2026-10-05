import { inventory } from '@/rules/body/elementInventory'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import type { DisplayField } from '@/shared/presentation/schema'

const EXCERPT = 60

/** The matching og:* meta elements of a page: records, overview markup and the four count rows. */
export const ogElements = (doc: Document, selector: string, extra?: (element: Element) => DisplayField[]) => {
  const { sample, total } = sampleElements(doc.querySelectorAll(selector))
  const records = inventory(sample, total, extra)
  return { first: sample[0] ?? null, total, ...records, detailValues: total ? records.counts : [] }
}

/** A trimmed content attribute as evidence text, never longer than the detail bound. */
export const contentField = (element: Element): DisplayField[] =>
  [textField('content', (element.getAttribute('content') || '').trim().slice(0, 160) || 'Empty')]

/** The content text as an overview row only when the original markup is not shown beside it (F3, F12). */
export const contentRow = (key: string, content: string, overviewMarkup: DisplayField[]): DisplayField[] =>
  overviewMarkup.length ? [] : [textField(key, content.length > EXCERPT ? `${content.slice(0, EXCERPT - 1)}…` : content)]
