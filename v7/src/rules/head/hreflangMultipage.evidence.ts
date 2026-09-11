import type { HreflangCheck } from './hreflangTarget'

import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import type { EvidenceRecord } from '@/shared/presentation/schema'

type Issue = { level: 'warn' | 'error'; text: string }
type Malformed = { hreflang: string; href: string }

const yesNo = (value: boolean | undefined) => (value === undefined ? 'Not determined' : value ? 'Yes' : 'No')
const foundNotFound = (value: boolean | undefined) => (value === undefined ? 'Not determined' : value ? 'Found' : 'Not found')

export const generalFindings = (issues: Issue[]): EvidenceRecord[] => issues.map((issue, index) => ({
  name: `Finding ${index + 1}`,
  fields: [textField('Severity', issue.level === 'error' ? 'Error' : 'Warning'), textField('Detail', issue.text)],
}))

export const malformedTargets = (malformed: Malformed[]): EvidenceRecord[] => malformed.map((entry, index) => ({
  name: `Malformed target ${index + 1}`,
  fields: [textField('Hreflang', entry.hreflang || 'Not declared'), textField('Href (raw)', entry.href || 'Not declared')],
}))

export const checkedTargets = (checked: HreflangCheck[]): EvidenceRecord[] => checked.map((check, index) => ({
  name: `Target ${index + 1}`,
  fields: [
    textField('Hreflang declarations', check.declarations.join(', ') || 'Not declared'),
    urlField('Target URL', check.href),
    textField('Status', check.error ? 'Request failed' : httpStatusLabel(check.status)),
    textField('Redirected', yesNo(check.redirected)),
    textField('Self reference', foundNotFound(check.selfReference)),
    textField('Back reference to canonical', foundNotFound(check.backReference)),
    textField('Target canonical', check.canonical || 'Not declared or invalid'),
    textField('Noindex for Googlebot', yesNo(check.noindex)),
    ...(check.error ? [textField('Error', check.error)] : []),
    ...(check.redirectChainText ? [textField('Redirect chain', check.redirectChainText)] : []),
    textField('Findings', check.issues.length ? check.issues.map((issue) => issue.text).join(' | ') : 'None'),
  ],
}))
