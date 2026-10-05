import { textField, urlField } from '@/shared/presentation/create'
import type { DisplayField } from '@/shared/presentation/schema'

// Facts of a failed Google API request (FORMATTING.md F9, F10): a short reason without URL or sentence.
const MAX_REASON_CHARS = 60
const ELLIPSIS = '...'
const URL_PATTERN = /https?:\/\/\S+/gi

const shortReason = (message: string): string => {
  const plain = message.replace(URL_PATTERN, 'URL').trim()
  const first = (plain.split('. ')[0] || plain).replace(/\.$/, '')
  if (!first) return 'Request failed'
  return first.length > MAX_REASON_CHARS ? `${first.slice(0, MAX_REASON_CHARS - ELLIPSIS.length).trimEnd()}${ELLIPSIS}` : first
}

/** `Request: Failed` and the bounded reason, as the first overview rows of a failed request. */
export const requestFailedRows = (message: string): DisplayField[] => [textField('Request', 'Failed'), textField('Error', shortReason(message))]

/** A URL as a link when it is HTTP(S), otherwise its literal text. */
export const urlOrText = (key: string, value: string): DisplayField => {
  try {
    return /^https?:$/.test(new URL(value).protocol) ? urlField(key, value) : textField(key, value)
  } catch {
    return textField(key, value)
  }
}
