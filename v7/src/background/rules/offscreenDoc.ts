import { Logger } from '@/shared/logger'

const url = 'src/offscreen.html'

const hasOffscreenSupport = () => Boolean(chrome.offscreen?.createDocument)

export const ensureOffscreenDocument = async (tabId: number): Promise<boolean> => {
  if (!hasOffscreenSupport()) {
    await Logger.logDirect(tabId, 'offscreen', 'no API support', {})
    return false
  }
  const has = await chrome.offscreen?.hasDocument?.()
  if (has) {
    await Logger.logDirect(tabId, 'offscreen', 'doc exists', {})
    return true
  }
  await Logger.logDirect(tabId, 'offscreen', 'create doc', { url })
  await chrome.offscreen?.createDocument({
    url,
    reasons: [chrome.offscreen.Reason.DOM_PARSER],
    justification: 'Run rules asynchronously in isolated doc',
  })
  await Logger.logDirect(tabId, 'offscreen', 'doc created', {})
  return true
}
