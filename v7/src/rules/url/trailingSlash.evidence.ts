import { httpUrlField } from '@/rules/http/navigationStepEvidence'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import type { EvidenceRecord } from '@/shared/presentation/schema'
import type { RedirectHop } from '@/shared/redirectChainTypes'

/** One named evidence record per hop of the probed variant's redirect chain ("Hop 1", "Hop 2", ...). */
export const hopEvidence = (hops: RedirectHop[]): EvidenceRecord[] =>
  hops.map((hop, index) => ({
    name: `Hop ${index + 1}`,
    fields: [
      httpUrlField('URL', hop.url),
      textField('Status', httpStatusLabel(hop.status || undefined)),
      ...(hop.location ? [httpUrlField('Location', hop.location)] : []),
    ],
  }))

/** Complete original canonical-link markup captured from the probed variant response's parsed document. */
export const variantCanonicalMarkup = (doc: Document) => {
  const element = doc.querySelector('link[rel~="canonical" i]')
  return markupEvidence(element ? [element] : [], 'Variant canonical markup')
}
