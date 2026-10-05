import { attrUrlField } from '@/rules/body/elementInventory'
import { httpUrlField } from '@/rules/http/navigationStepEvidence'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
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

/** The canonical link of the probed variant response: original markup and one evidence record, named by its tag. */
export const variantCanonical = (doc: Document, base: string) => {
  const element = doc.querySelector('link[rel~="canonical" i]')
  return elementRecords(element ? [element] : [], element ? 1 : 0, (link) => [attrUrlField('href', link.getAttribute('href'), base)])
}
