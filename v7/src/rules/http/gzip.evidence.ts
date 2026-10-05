import { anonymousFetch } from '@/shared/probeFetch'
import { textField } from '@/shared/presentation/create'

export const KNOWN_ENCODINGS: Record<string, { name: string; note: string; accepted: boolean }> = {
  br: { name: 'Brotli', note: 'Brotli (modern, recommended)', accepted: true },
  gzip: { name: 'Gzip', note: 'Gzip (widely supported, recommended)', accepted: true },
  zstd: { name: 'Zstandard', note: 'Zstandard compression', accepted: true },
  deflate: { name: 'Deflate', note: 'Deflate (legacy but accepted; prefer gzip or Brotli)', accepted: true },
  compress: { name: 'LZW compress', note: 'LZW compress (obsolete)', accepted: false },
  identity: { name: 'identity', note: 'identity (no compression)', accepted: false },
}

/** The coding named for the overview: its registry name, or the unlisted token itself. */
export const codingName = (encoding: string): string => KNOWN_ENCODINGS[encoding]?.name ?? encoding

export const parseEncodings = (encodingHeader: string | null | undefined) =>
  (encodingHeader || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

export const isHtmlLike = (headers: Record<string, string>) => {
  const ct = (headers['content-type'] || '').toLowerCase()
  return ct.includes('text/html') || ct.includes('application/xhtml+xml')
}

export const normalizeHeaders = (headers?: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(headers || {}).map(([k, v]) => [k.toLowerCase(), v]))

export const fetchHeadHeaders = async (url: string, signal?: AbortSignal) => {
  try {
    const r = await anonymousFetch(url, { method: 'HEAD', redirect: 'follow', signal })
    const h: Record<string, string> = {}
    r.headers.forEach((v, k) => { h[k.toLowerCase()] = v })
    return h
  } catch {
    return undefined
  }
}

export const headerSourceLabel = (source: 'captured' | 'probe'): string =>
  source === 'probe' ? 'HEAD re-probe of the page URL' : 'Captured response headers'

export const encodingEvidence = (encodings: string[]) => encodings.map((enc) => ({
  name: `Content-Encoding token ${enc}`,
  fields: [
    textField('Coding', KNOWN_ENCODINGS[enc]?.note ?? 'Unlisted coding'),
    textField('Accepted', KNOWN_ENCODINGS[enc]?.accepted ? 'Yes' : 'No'),
  ],
}))
