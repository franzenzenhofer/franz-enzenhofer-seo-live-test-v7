import type { IconName } from './Icon'

import type { Result } from '@/core/types'
import { statusLabels } from '@/shared/presentation/statusLabels'

export const actionClass = 'flex h-8 shrink-0 items-center justify-center gap-1 rounded-md px-2 text-sm text-slate-600 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700'
export const statusIcons: Record<Result['type'], [IconName, string]> = {
  ok: ['circle-check', statusLabels.ok], error: ['circle-x', statusLabels.error], warn: ['triangle-alert', statusLabels.warn],
  info: ['info', statusLabels.info], not_applicable: ['circle-minus', statusLabels.not_applicable],
  pending: ['loader-circle', statusLabels.pending], disabled: ['circle-pause', statusLabels.disabled], runtime_error: ['circle-alert', statusLabels.runtime_error],
}
