import { assertSafeProbe } from './probeSafety'

const requestUrl = (input: RequestInfo | URL): string => (input instanceof Request ? input.url : String(input))

/**
 * Every request the extension sends to a page-derived URL goes through here.
 *
 * Chrome attaches the user's cookies to extension fetches of host-permitted
 * URLs even in the default 'same-origin' credentials mode, and treats them as
 * same-site (https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies),
 * so a plain probe acts with the user's logged-in session - in a CMS that
 * executes nonce-signed GET actions. 'omit' sends no cookies and no cached
 * HTTP auth, on every redirect hop (https://fetch.spec.whatwg.org/#http-network-or-cache-fetch):
 * the probe is anonymous, which is also what Googlebot sees.
 */
export const withAnonymity = (base?: typeof fetch): typeof fetch => async (input, init) => {
  assertSafeProbe(requestUrl(input))
  return (base ?? fetch)(input, { ...init, credentials: 'omit' })
}

export const anonymousFetch: typeof fetch = withAnonymity()
