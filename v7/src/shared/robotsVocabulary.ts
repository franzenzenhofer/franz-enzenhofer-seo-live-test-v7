// Decides which <meta name="..."> tags are robots directives.
//
// The robots meta tag's name is a crawler user-agent ("robots", "googlebot",
// or any bot name), but <head> is full of standard metas - viewport, referrer,
// generator, description - that are NOT robots directives. Treating every meta
// as one poisons the agent/conflict/list rules with false claims on nearly
// every page, so a meta counts as a robots directive only when its name is a
// well-known crawler UA or its content reads as robots-directive tokens.

const KNOWN_ROBOTS_UAS = new Set([
  'robots',
  'googlebot',
  'googlebot-news',
  'googlebot-image',
  'googlebot-video',
  'googlebot-smartphone',
  'google',
  'bingbot',
  'msnbot',
  'slurp',
  'baiduspider',
  'duckduckbot',
  'yandex',
  'yandexbot',
  'applebot',
])

// Tokens that stand alone as a complete robots directive.
const VALUE_TOKENS = new Set([
  'all', 'index', 'noindex', 'follow', 'nofollow', 'none', 'noarchive',
  'nosnippet', 'notranslate', 'noimageindex', 'indexifembedded',
  'nositelinkssearchbox', 'nocache', 'noodp', 'noydir',
])

// Tokens that carry a value after a colon (max-snippet:50, unavailable_after:date).
const PREFIX_TOKENS = new Set(['max-snippet', 'max-image-preview', 'max-video-preview', 'unavailable_after'])

// Tokens so specific that one occurrence marks the meta as a robots directive
// even when other tokens do not parse (e.g. a comma inside an
// unavailable_after date splits the value into non-vocabulary parts).
const STRONG_TOKENS = new Set([
  'noindex', 'nofollow', 'none', 'noarchive', 'nosnippet', 'noimageindex',
  'notranslate', 'indexifembedded', 'nositelinkssearchbox',
])

const TOKEN_SCAN_LIMIT = 200

const tokenKey = (token: string): string => {
  const normalized = token.trim().toLowerCase()
  const colon = normalized.indexOf(':')
  return colon === -1 ? normalized : normalized.slice(0, colon).trim()
}

const isVocabularyToken = (token: string): boolean => {
  const key = tokenKey(token)
  return VALUE_TOKENS.has(key) || PREFIX_TOKENS.has(key)
}

const isStrongToken = (token: string): boolean => {
  const key = tokenKey(token)
  return STRONG_TOKENS.has(key) || PREFIX_TOKENS.has(key)
}

// A directive key is a robots token name ('noindex', 'max-snippet', ...) - the
// header parser needs this to tell 'max-snippet: 20' apart from a UA prefix.
export const isRobotsDirectiveKey = (key: string): boolean => {
  const normalized = key.trim().toLowerCase()
  return VALUE_TOKENS.has(normalized) || PREFIX_TOKENS.has(normalized)
}

export const isRobotsMetaDirective = (name: string, content: string): boolean => {
  const ua = name.trim().toLowerCase()
  if (KNOWN_ROBOTS_UAS.has(ua)) return true
  const tokens = content.split(/[,;]/).map((t) => t.trim()).filter(Boolean).slice(0, TOKEN_SCAN_LIMIT)
  if (!tokens.length) return false
  if (tokens.every(isVocabularyToken)) return true
  return tokens.some(isStrongToken)
}
