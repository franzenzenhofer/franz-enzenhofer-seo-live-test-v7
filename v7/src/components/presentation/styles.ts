import type { IconName } from './Icon'

import type { Result } from '@/core/types'

export const actionClass = 'flex h-8 shrink-0 items-center justify-center gap-1 rounded-md px-2 text-sm text-slate-600 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700'
export const statusIcons: Record<Result['type'], [IconName, string]> = {
  ok: ['circle-check', 'Passed'], error: ['circle-x', 'Failed'], warn: ['triangle-alert', 'Criterion not met'],
  info: ['info', 'Observation'], not_applicable: ['circle-minus', 'Not applicable'],
  pending: ['loader-circle', 'Checking'], disabled: ['circle-pause', 'Disabled'], runtime_error: ['circle-alert', 'Check could not run'],
}
