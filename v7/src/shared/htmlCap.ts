// Caps DOM-capture HTML so a single chrome.runtime.sendMessage stays
// under the conservative 32 KB budget from the MV3 hardening plan.
// Heavy pages (Gmail, NYT) are reduced to size + sha256 + head/tail snippet
// while small pages flow through unchanged.

export const HTML_CAP_BYTES = 256 * 1024 // 256 KB hard cap on the payload arm
const SNIPPET_BYTES = 1024 // head/tail kept for human debugging

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export interface CappedHtml {
  size: number
  sha256: string
  truncated: boolean
  snippet: string
  payload: string
}

const sha256 = async (text: string): Promise<string> => {
  try {
    const data = encoder.encode(text)
    const hashBuf = await crypto.subtle.digest('SHA-256', data)
    return [...new Uint8Array(hashBuf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return ''
  }
}

const cutBytes = (text: string, max: number): string => {
  const bytes = encoder.encode(text)
  if (bytes.length <= max) return text
  return decoder.decode(bytes.subarray(0, max))
}

export const capHtmlForMessage = (html: string): CappedHtml => {
  const bytes = encoder.encode(html)
  const size = bytes.length
  if (size <= HTML_CAP_BYTES) {
    return { size, sha256: '', truncated: false, snippet: cutBytes(html, SNIPPET_BYTES), payload: html }
  }
  const head = cutBytes(html, SNIPPET_BYTES)
  const tail = decoder.decode(bytes.subarray(Math.max(0, size - SNIPPET_BYTES), size))
  return { size, sha256: '', truncated: true, snippet: `${head}\n...[truncated ${size - SNIPPET_BYTES * 2} bytes]...\n${tail}`, payload: '' }
}

// Async variant that fills the sha256 field. Use when the caller can await.
export const capHtmlForMessageAsync = async (html: string): Promise<CappedHtml> => {
  const sync = capHtmlForMessage(html)
  if (!sync.truncated) return sync
  const digest = await sha256(html)
  return { ...sync, sha256: digest }
}
