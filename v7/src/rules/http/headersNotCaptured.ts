import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Page, Result, Rule } from '@/core/types'

// Shared "headers not captured" branch for header-only HTTP rules in this
// family: preserves the original noHeadersResult() type/priority (runtime
// error, priority 50) while emitting the new presentation contract.
export const headersNotCapturedResult = (rule: Rule, page: Page, header: string): Result => presentResult(rule, page, {
  input: 'Not captured', type: 'runtime_error', priority: 50,
  values: [textField('Response headers', 'Not captured')],
  checked: [textField('Header', header), textField('Capture requirement', 'HTTP response headers')],
  noMarkup: 'None - this rule checks the HTTP response, not document markup',
})
