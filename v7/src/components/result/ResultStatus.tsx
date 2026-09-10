import type { Result } from '@/shared/results'

const LABELS: Record<Result['type'], string> = {
  ok: 'Check passed', warn: 'Needs review', error: 'Problem found',
  not_applicable: 'Not applicable',
  info: 'Information', runtime_error: 'Not checked', pending: 'Checking…', disabled: 'Disabled',
}
export const ResultStatus = ({ type }: { type: Result['type'] }) => (
  <p className="text-base font-semibold" data-testid="result-status">{LABELS[type]}</p>
)
