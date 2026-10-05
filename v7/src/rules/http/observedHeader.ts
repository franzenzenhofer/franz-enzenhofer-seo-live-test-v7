import { textField } from '@/shared/presentation/create'
import type { EvidenceRecord } from '@/shared/presentation/schema'
import { listRow, OVERVIEW_VALUE_LIMIT } from '@/shared/presentation/listRow'

// Header cards (FORMATTING.md): the observed header value is the first overview row, `Absent` when
// the header is missing; overview text stays within 60 characters; the complete value is evidence.
export const HEADER_NO_MARKUP = 'None - this rule checks the HTTP response, not document markup'

/** The observed header value, verbatim when it fits the overview, list-shortened otherwise. */
export const headerRow = (key: string, value: string) => {
  if (!value) return textField(key, 'Absent')
  return textField(key, value.length <= OVERVIEW_VALUE_LIMIT ? value : listRow(value.split(',').map((part) => part.trim()).filter(Boolean)))
}

/** One evidence record for a present header, holding its complete value. */
export const headerEvidence = (name: string, value: string): EvidenceRecord[] => value ? [{ name, fields: [textField('Value', value)] }] : []
