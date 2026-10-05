import { httpUrlField } from './navigationStepEvidence'

import { NavigationLedgerSchema } from '@/background/history/types'
import type { NavigationHop } from '@/background/history/types'
import type { NavigationStep } from '@/shared/navigationSteps'
import { textField } from '@/shared/presentation/create'
import type { DisplayField } from '@/shared/presentation/schema'

/** The recorded navigation trace, or null when no ledger was captured for this run. */
export const ledgerTrace = (globals: Record<string, unknown>): NavigationHop[] | null => {
  const ledger = NavigationLedgerSchema.safeParse(globals['navigationLedger'])
  return ledger.success ? ledger.data.trace : null
}

/**
 * The one overview row when no navigation ledger exists for this run. The response headers were
 * read (the rule's precondition), so they stay the checked input; the navigation path itself was
 * not checked. `Not captured` as a row is reserved for a checked input of `Not captured` (F13),
 * which the F3 restatement check forbids beside such a row.
 */
export const NAVIGATION_NOT_CHECKED: DisplayField = textField('Navigation events', 'Not checked')
export const NAVIGATION_NONE: DisplayField = textField('Navigation events', 'None')

/** Journey endpoints for the overview: `Final URL`, preceded by `First URL` only when it differs (F3). */
export const journeyRows = (steps: NavigationStep[]): DisplayField[] => {
  const first = steps[0]?.url
  const last = steps.at(-1)?.url
  if (!last) return []
  return [...(first && first !== last ? [httpUrlField('First URL', first)] : []), httpUrlField('Final URL', last)]
}

/** Redirect hops as one observed value, never a bare count of 1 beside a single markup field (F3). */
export const redirectSummary = (server: number, client: number): string =>
  server + client ? `${server} server, ${client} client-side` : 'None'
