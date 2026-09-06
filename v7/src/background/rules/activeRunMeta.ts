import { withActiveSession } from './sessions'

import { writeRunMeta, type RunMeta } from '@/shared/runMeta'

export const writeActiveRunMeta = (tabId: number, meta: RunMeta) =>
  withActiveSession(tabId, meta.runId, () => writeRunMeta(tabId, meta))
