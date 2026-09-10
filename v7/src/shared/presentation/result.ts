import { createPresentation, referenceUrls, textField } from './create'
import { presentationSchema } from './schema'
import type { Presentation } from './schema'

import type { Page, Result, Rule } from '@/core/types'

type Facts = Pick<Presentation, 'input' | 'values' | 'checked'> & Partial<Presentation> & Pick<Result, 'type' | 'priority'> & { label?: string }
export const presentResult = (rule: Rule, page: Page, facts: Facts): Result => {
  const { type, priority, label, ...data } = facts
  const presentation = createPresentation({ ...data, name: rule.name, pageUrl: page.url, references: rule.meta.references })
  return { name: rule.name, label: label ?? (rule.id.split(/[:-]/)[0] || 'RULE').toUpperCase(),
    ruleId: rule.id, type, priority, presentation,
    message: presentation.values.filter((field) => field.kind !== 'original').map(({ key, value }) => `${key}: ${value}`).join('; '),
  }
}
export const validateRulePresentation = (result: Result, rule: Rule) => {
  if (rule.presentation !== 1) return result.presentation
  return presentationSchema.parse({ ...result.presentation, references: referenceUrls(rule.meta.references) })
}
export const executionPresentation = (rule: Rule, execution: string) => rule.presentation === 1 ? createPresentation({
  name: rule.name, input: 'Not checked', pageUrl: '', references: rule.meta.references,
  values: [textField('Execution', execution)],
  checked: [textField('Configured input', rule.input || rule.what || 'Not specified')],
  noMarkup: `None — ${execution.toLowerCase()}`,
}) : undefined
