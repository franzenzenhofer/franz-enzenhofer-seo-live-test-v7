import { captureDomPhase } from './domCapture'
import { waitForDomQuiet } from './domSettle'
import { contentTabId, getContentTabId } from './tabContext'

import { Logger } from '@/shared/logger'
import { isRecaptureMessage, sameDocumentUrl } from '@/shared/softNavigation'

export type PhaseCapture = (event: 'document_end' | 'document_idle') => Promise<void>
export type RecaptureOutcome = 'captured' | 'superseded' | 'url-mismatch'
export type RecaptureEnv = { capture: PhaseCapture; root: Node; href: () => string }

const liveEnv = (): RecaptureEnv => ({
  capture: (event) => captureDomPhase(event, contentTabId, getContentTabId),
  root: document,
  href: () => location.href,
})

let active: AbortController | null = null

/**
 * Captures the document's new route after a soft navigation: waits (bounded)
 * for the SPA's DOM swap to go quiet, then runs the static and the idle phase
 * exactly as a document load does. A newer request supersedes a pending one;
 * a route that moved on before or between the phases is never captured under
 * the requested URL, so the background sees only the capture it asked for.
 */
export const recaptureRoute = async (url: string, env: RecaptureEnv = liveEnv()): Promise<RecaptureOutcome> => {
  active?.abort('superseded')
  const controller = new AbortController()
  active = controller
  const settled = await waitForDomQuiet(env.root, { signal: controller.signal })
  if (settled === 'aborted') return 'superseded'
  if (!sameDocumentUrl(env.href(), url)) return 'url-mismatch'
  await env.capture('document_end')
  if (controller.signal.aborted) return 'superseded'
  if (!sameDocumentUrl(env.href(), url)) return 'url-mismatch'
  await env.capture('document_idle')
  if (active === controller) active = null
  return controller.signal.aborted ? 'superseded' : 'captured'
}

const report = async (url: string, run: Promise<RecaptureOutcome>) => {
  const tabId = await contentTabId
  try {
    const outcome = await run
    Logger.logDirectSend(tabId, 'dom', 'recapture', { url, outcome })
  } catch (error) {
    Logger.logDirectSend(tabId, 'dom', 'recapture failed', { url, error: error instanceof Error ? error.message : String(error) })
  }
}

/** runtime.onMessage handler for the background's recapture request; replies at once, captures asynchronously. */
export const handleRecaptureMessage = (msg: unknown, reply: (response: { ok: boolean }) => void, env?: RecaptureEnv): boolean => {
  if (!isRecaptureMessage(msg)) return false
  reply({ ok: true })
  report(msg.url, recaptureRoute(msg.url, env)).catch(() => {})
  return true
}
