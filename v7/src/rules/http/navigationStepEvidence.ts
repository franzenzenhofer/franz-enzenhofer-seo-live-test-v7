import type { Page } from '@/core/types'
import { EVIDENCE_LIMIT } from '@/shared/domEvidence'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import type { NavigationStep } from '@/shared/navigationSteps'
import { textField, urlField } from '@/shared/presentation/create'
import type { DisplayField, EvidenceRecord } from '@/shared/presentation/schema'

const TYPE_LABEL: Record<NavigationStep['type'], string> = {
  http_redirect: 'HTTP redirect',
  client_redirect: 'Client-side redirect',
  history_api: 'Browser history updated',
  load: 'Page load',
}

/** A URL field only when the value actually resolves to an absolute http(s) URL; a plain text fact otherwise. */
export const httpUrlField = (key: string, value: string): DisplayField => /^https?:\/\//i.test(value) ? urlField(key, value) : textField(key, value)

/** Joins only the input sources this execution actually read; 'Not captured' when none did. */
export const combineInputs = (...parts: Array<string | false | undefined>): string => parts.filter((part): part is string => !!part).join(' + ') || 'Not captured'

type HeaderHop = NonNullable<Page['headerChain']>[number]
// A history update makes no request; a request without a matching header-chain hop has no captured cache flag.
const fromCacheFact = (step: NavigationStep, hop: HeaderHop | undefined): string => {
  if (step.type === 'history_api') return 'Not applicable'
  if (!hop || hop.fromCache === undefined) return 'Not captured'
  return hop.fromCache ? 'Yes' : 'No'
}

/**
 * One named evidence record per observed navigation step ("Hop 1", "Hop 2", ...), bounded to
 * EVIDENCE_LIMIT records plus a retained/omitted record, shared by every rule that follows the
 * recorded navigation/redirect journey. Cross-references `page.headerChain` (main-document
 * webRequest hops) only to report `fromCache`, which the merged navigation step never carries.
 */
export const navigationStepEvidence = (steps: NavigationStep[], headerChain: Page['headerChain']): EvidenceRecord[] => {
  const records = steps.slice(0, EVIDENCE_LIMIT).map((step, index): EvidenceRecord => ({
    name: `Hop ${index + 1}`,
    fields: [
      httpUrlField('URL', step.url),
      textField('Event type', TYPE_LABEL[step.type]),
      ...(step.statusCode !== undefined ? [textField('Status', httpStatusLabel(step.statusCode))] : []),
      ...(step.target ? [httpUrlField('Location', step.target)] : []),
      textField('From cache', fromCacheFact(step, headerChain?.find((candidate) => candidate.url === step.url))),
    ],
  }))
  const omitted = steps.length - records.length
  return omitted ? [...records, { name: 'Navigation steps', fields: [textField('Retained', records.length), textField('Omitted', omitted)] }] : records
}
