import { logAuthEvent as logAuth } from './authLog'
import { interactiveLogin } from './authLogin'
import { getStoredToken, setStoredToken, TOKEN_KEY } from './tokenStorage'

export { TOKEN_KEY, getStoredToken, setStoredToken, interactiveLogin }

export const refreshIfPresent = async (): Promise<string | null> => {
  const t = await getStoredToken()
  if (!t) {
    logAuth('refresh:skip', { reason: 'no-token' })
    return null
  }
  logAuth('refresh:start')
  return new Promise((res) => {
    chrome.identity.getAuthToken({ interactive: false }, (nt) => {
      const err = chrome.runtime?.lastError?.message
      if (err) logAuth('refresh:error', { error: err })
      if (nt) {
        logAuth('refresh:success')
        setStoredToken(nt).then(() => res(nt)).catch(() => res(nt))
      } else {
        logAuth('refresh:fallback', { reason: 'token-reused' })
        res(t)
      }
    })
  })
}

export const revoke = async (): Promise<void> => {
  const t = await getStoredToken()
  if (!t) {
    logAuth('revoke:skip', { reason: 'no-token' })
    return
  }
  logAuth('revoke:start')
  try {
    await fetch('https://accounts.google.com/o/oauth2/revoke?token=' + t)
  } catch (error) {
    logAuth('revoke:fetch-error', { error: error instanceof Error ? error.message : String(error) })
  }
  await new Promise((r) => {
    chrome.identity.removeCachedAuthToken({ token: t }, () => {
      const err = chrome.runtime?.lastError?.message
      if (err) logAuth('revoke:cache-error', { error: err })
      r(null)
    })
  })
  await setStoredToken(null)
  logAuth('revoke:done')
}
