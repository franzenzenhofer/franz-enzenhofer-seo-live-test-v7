import { expect, it } from 'vitest'

import { titleRule } from '@/rules/head/title'
import { registerRule } from '@/rules/ruleInputs'
import { mergeRunResults } from '@/offscreen/runResults'
import { matchesResult } from '@/sidepanel/ui/resultQuery'
import { createPresentation, textField } from '@/shared/presentation/create'
import { presentationCopy } from '@/shared/presentation/copy'

it('keeps unavailable lifecycle captures in the same result contract', () => {
  const result = mergeRunResults([registerRule(titleRule)], [], [], 'capture-run')[0]!
  expect(result.type).toBe('runtime_error')
  expect(result.presentation?.input).toBe('Not checked')
  expect(result.presentation?.references).toEqual(titleRule.meta.references)
  expect(result.presentation?.values[0]?.value).toBe('Required capture unavailable')
  expect(result.ruleId).toBe(titleRule.id)
})
it('searches extracted values, evidence and references and copies a readable status', () => {
  const presentation = createPresentation({ name: 'Example', input: 'Idle DOM', pageUrl: 'https://example.test',
    values: [textField('Count', 1)], detailValues: [textField('Title', 'Kyrgyzstan trails')],
    checked: [textField('Selector', 'h1')], evidence: [{ name: 'Observed', fields: [textField('Attribute', 'data-template')] }],
    references: ['https://docs.example.test/reference'],
  })
  const result = { label: 'BODY', name: 'Example', message: 'Count: 1', type: 'not_applicable' as const, presentation }
  for (const query of ['kyrgyzstan', 'data-template', 'docs.example.test']) expect(matchesResult(result, { q: query })).toBe(true)
  expect(matchesResult(result, { q: 'absent text' })).toBe(false)
  expect(presentationCopy(result)).toContain('Status: Not applicable')
})
