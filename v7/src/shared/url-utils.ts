/**
 * URL validation and manipulation utilities
 * Consolidates duplicated URL logic from multiple rule files
 */

export const isSameHost = (baseUrl: string, targetUrl: string): boolean => {
  try {
    const base = new URL(baseUrl)
    const target = new URL(targetUrl, baseUrl)
    return base.host === target.host
  } catch {
    return false
  }
}

export const isAbsoluteUrl = (url: string): boolean => {
  return /^https?:\/\//i.test(url)
}

export const isHttps = (url: string): boolean => {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const normalizeUrl = (url: string): string => {
  try {
    const u = new URL(url)
    u.hash = ''
    u.search = ''
    u.pathname = u.pathname
      .replace(/\/index\.(html?)$/i, '/')
      .replace(/([^/])$/, '$1')
    if (u.pathname !== '/' && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1)
    }
    u.hostname = u.hostname.toLowerCase()
    return u.toString()
  } catch {
    return url
  }
}
