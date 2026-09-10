import type { Result } from '@/core/types'

export const statusLabels: Record<Result['type'], string> = {
  ok: 'Passed', error: 'Failed', warn: 'Criterion not met', info: 'Observation',
  not_applicable: 'Not applicable', pending: 'Checking', disabled: 'Disabled', runtime_error: 'Check could not run',
}
