import { OAUTH_SCOPES } from '../../config.js'

import { logAuthEvent as logAuth } from './authLog'
import { setStoredToken } from './tokenStorage'

export const interactiveLogin = async (): Promise<string | null> => {
  const manifest = chrome.runtime.getManifest()
  const clientId = manifest.oauth2?.client_id || 'NOT_CONFIGURED'
  const manifestScopes = manifest.oauth2?.scopes || []
  const extensionId = chrome.runtime.id

  logAuth('login:start', {
    clientId: clientId.slice(0, 30) + '...',
    clientIdFull: clientId,
    extensionId,
    requestScopes: OAUTH_SCOPES.length,
    manifestScopes: manifestScopes.length,
    interactive: true,
  })

  logAuth('login:scopes-requested', {
    scopes: JSON.stringify(OAUTH_SCOPES),
    scope1: OAUTH_SCOPES[0] || 'none',
    scope2: OAUTH_SCOPES[1] || 'none',
  })

  logAuth('login:manifest-scopes', {
    manifestScopes: JSON.stringify(manifestScopes),
  })

  const requestParams = {
    interactive: true,
    scopes: OAUTH_SCOPES,
  }

  logAuth('login:request-params', {
    params: JSON.stringify(requestParams),
    interactive: requestParams.interactive,
    scopeCount: requestParams.scopes.length,
  })

  logAuth('login:calling-chrome-identity-api')

  return new Promise((res) => {
    chrome.identity.getAuthToken(requestParams, (token) => {
      const err = chrome.runtime?.lastError
      const errMsg = err?.message || null

      logAuth('login:callback-received', {
        hasToken: !!token,
        hasError: !!errMsg,
        tokenLength: token?.length || 0,
        errorPresent: !!err,
      })

      if (errMsg) {
        logAuth('login:error-details', {
          errorMessage: errMsg,
          errorType: typeof err,
          errorKeys: err ? Object.keys(err).join(',') : 'none',
          fullErrorJson: JSON.stringify(err),
        })
      }

      if (err) {
        logAuth('login:error-object', {
          message: err.message || 'no-message',
          stack: (err as Error).stack || 'no-stack',
          name: (err as Error).name || 'no-name',
        })
      }

      if (token) {
        const masked = token.slice(0, 10) + '...' + token.slice(-4)
        logAuth('login:success', {
          tokenMasked: masked,
          tokenLength: token.length,
          tokenPrefix: token.slice(0, 10),
          tokenSuffix: token.slice(-4),
        })
        setStoredToken(token)
          .then(() => {
            logAuth('login:token-stored')
            res(token)
          })
          .catch((storeErr) => {
            logAuth('login:token-store-error', {
              error: storeErr instanceof Error ? storeErr.message : String(storeErr),
            })
            res(token)
          })
      } else {
        logAuth('login:cancelled', {
          reason: 'no-token-returned',
          hadError: !!errMsg,
          errorMessage: errMsg || 'none',
        })
        res(null)
      }
    })
  })
}
