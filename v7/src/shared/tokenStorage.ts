import { logAuthEvent as logAuth } from './authLog'

export const TOKEN_KEY = 'googleApiAccessToken'

export const getStoredToken = async (): Promise<string | null> =>
  ((await chrome.storage.local.get(TOKEN_KEY))[TOKEN_KEY] as string) || null

export const setStoredToken = async (token: string | null) => {
  if (token) {
    await chrome.storage.local.set({ [TOKEN_KEY]: token })
    logAuth('token:stored', { masked: `${token.slice(0, 4)}…` })
  } else {
    await chrome.storage.local.remove(TOKEN_KEY)
    logAuth('token:cleared')
  }
}
