import type { Page } from '@/core/types'
import { textField } from '@/shared/presentation/create'

// Resource-ledger coverage as labelled facts. page.resourceDropped equals
// coverage.dropped and coverage.retained equals the retained resource count,
// so neither is repeated here.
export const coverageDetails = (page: Page) => {
  const coverage = page.resourceCoverage
  if (!coverage) return [textField('Resource ledger coverage', 'Not captured')]
  return [
    textField('Resource events captured', coverage.events),
    textField('Resource events dropped', coverage.dropped),
    textField('Resource ledger truncated', coverage.truncated ? 'Yes' : 'No'),
  ]
}
