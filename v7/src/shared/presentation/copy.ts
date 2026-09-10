import { statusLabels } from './statusLabels'
import type { DisplayField } from './schema'

import type { Result } from '@/core/types'

const lines = (fields: DisplayField[]) => fields.map(({ key, value }) => `${key}: ${value}`)
export const presentationCopy = (result: Result): string => {
  const view = result.presentation
  if (!view) return ''
  return [
    `Rule: ${view.name}`, `Status: ${statusLabels[result.type]}`, `Page URL: ${view.pageUrl}`,
    `Checked input: ${view.input}`, ...lines(view.values), ...lines(view.detailValues),
    '', 'Checked:', ...lines(view.checked),
    ...view.evidence.flatMap((record) => ['', `${record.name}:`, ...lines(record.fields)]),
    '', 'Retrieved markup:', ...(view.markup.length ? lines(view.markup) : [view.noMarkup]),
    '', ...view.references.map((url) => `Reference: ${url}`),
    '', `Rule ID: ${result.ruleId ?? 'Not assigned'}`, `Run position: ${result.runIndex ?? 'Not assigned'}`,
    `Sort priority: ${result.priority ?? 'Not assigned'}`,
  ].join('\n')
}
