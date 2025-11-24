import { STORAGE_KEYS } from './storage-keys'

export const DEFAULT_BLOCKLIST = [
  'chrome://',
  'chrome-extension://',
  'view-source:',
  'about:',
  'edge://',
  'google.com',
  'google.',
  'developers.google.com/speed/pagespeed/insights',
  'search.google.com',
] as const

export const normalizeBlocklistEntries = (input: unknown): string[] => {
  const parts = Array.isArray(input) ? input : String(input ?? '').split('\n')
  return Array.from(new Set(parts.map((v) => v.trim().toLowerCase()).filter(Boolean)))
}

const matchesEntry = (url: string, entry: string) => {
  const normalizedEntry = entry.trim().toLowerCase()
  if (!normalizedEntry) return false
  const normalizedUrl = url.toLowerCase()
  if (normalizedEntry === '*') return true
  if (normalizedEntry.includes('*')) {
    const pattern = normalizedEntry.replace(/\*/g, '')
    if (!pattern) return true
    if (normalizedUrl.includes(pattern)) return true
  }
  if (normalizedEntry.includes('://')) return normalizedUrl.startsWith(normalizedEntry)
  try {
    const { hostname } = new URL(url)
    const host = hostname.toLowerCase()
    const target = normalizedEntry.startsWith('.') ? normalizedEntry.slice(1) : normalizedEntry
    if (host === target || host.endsWith(`.${target}`)) return true
  } catch {
    // Non-standard URLs (chrome://, view-source:) fall back to substring matching
  }
  return normalizedUrl.includes(normalizedEntry)
}

export const findBlocklistMatch = (url: string, entries: string[]): string | null => {
  if (!url) return null
  const match = entries.find((entry) => matchesEntry(url, entry))
  return match || null
}

export const readBlocklist = async (): Promise<string[]> => {
  const key = STORAGE_KEYS.UI.BLOCKLIST
  const { [key]: stored } = await chrome.storage.local.get(key)
  if (Array.isArray(stored)) return normalizeBlocklistEntries(stored)
  return [...DEFAULT_BLOCKLIST]
}

export const isUrlBlocked = async (url: string): Promise<{ blocked: boolean; matched?: string }> => {
  const list = await readBlocklist()
  const matched = findBlocklistMatch(url, list) || undefined
  return { blocked: Boolean(matched), matched }
}
