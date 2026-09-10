import { createPresentation, textField } from './create'
import type { Presentation } from './schema'

const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length
export const boundPresentation = (view: Presentation, limit = 8_192): Presentation => {
  if (bytes(view) <= limit) return view
  // Never run generic string truncation over attested original data.
  // Retain whole records only, stating precisely which evidence was omitted.
  const compact = { ...view, markup: [] as Presentation['markup'], evidence: [] as Presentation['evidence'] }
  compact.values = compact.values.filter((field) => field.kind !== 'original')
  if (!compact.values.length) compact.values = [textField('Evidence', 'Capture exceeds storage capacity')]
  compact.detailValues = compact.detailValues.filter((field) => field.kind !== 'original')
  compact.noMarkup = `Original markup omitted: ${view.markup.length} record(s); storage capacity exceeded`
  compact.detailValues.push(textField('Evidence records omitted', view.evidence.length))
  if (bytes(compact) <= limit) return compact
  return createPresentation({
    name: view.name, input: view.input, pageUrl: view.pageUrl, references: view.references,
    values: [textField('Evidence', 'Result evidence exceeds storage capacity')],
    checked: [textField('Capture size', `${bytes(view)} bytes`)],
    noMarkup: 'Original markup omitted because the result exceeds storage capacity',
  })
}
