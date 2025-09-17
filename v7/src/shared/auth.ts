export const TOKEN_KEY = 'googleApiAccessToken'

export const getStoredToken = async (): Promise<string | null> => {
  const { [TOKEN_KEY]: t } = await chrome.storage.local.get(TOKEN_KEY)
  return (t as string) || null
}

export const setStoredToken = async (token: string | null) => {
  if (token) await chrome.storage.local.set({ [TOKEN_KEY]: token })
  else await chrome.storage.local.remove(TOKEN_KEY)
}

export const refreshIfPresent = async (): Promise<string | null> => {
  const t = await getStoredToken()
  if (!t) return null
  return new Promise((res) => {
    chrome.identity.getAuthToken({ interactive: false }, (nt) => {
      if (nt) setStoredToken(nt).then(() => res(nt)).catch(() => res(nt))
      else res(t)
    })
  })
}

export const interactiveLogin = async (): Promise<string | null> => new Promise((res) => {
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (token) setStoredToken(token).then(() => res(token)).catch(() => res(token))
    else res(null)
  })
})

export const revoke = async (): Promise<void> => {
  const t = await getStoredToken(); if (!t) return
  await fetch('https://accounts.google.com/o/oauth2/revoke?token=' + t)
  await new Promise((r) => chrome.identity.removeCachedAuthToken({ token: t }, () => r(null)))
  await setStoredToken(null)
}
