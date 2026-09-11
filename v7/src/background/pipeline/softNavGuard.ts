import type { EventRec, Run } from './types'

import { sameDocumentUrl } from '@/shared/softNavigation'

type PhaseIdentity = { url?: string; capturedAt?: number }

/**
 * A soft-navigation run owns one capture: the one the background requested for
 * its URL after the history update. The document did not change, so the
 * documentId guard cannot tell a stale capture of the previous route from the
 * requested one - the phase identity can: it names the URL the snapshot was
 * taken at and when. Anything captured at another URL, or before the history
 * update was recorded, belongs to the previous route and is dropped.
 */
export const acceptsSoftNavPhase = (run: Run, ev: EventRec): boolean => {
  if (!run.softNav || !ev.t.startsWith('dom:')) return true
  const identity = ev.d as PhaseIdentity | undefined
  const url = identity?.url ?? ev.u
  return sameDocumentUrl(url, run.softNav.url) && (identity?.capturedAt ?? 0) >= run.softNav.at
}
