import { abortScope, raceAbort, throwIfAborted } from './abort'

export const HTML_RESPONSE_BYTES = 1_000_000
export type BodyOptions = { maxBytes?: number; timeoutMs?: number; signal?: AbortSignal }
/** `truncated` means the body was longer than the bound - `bytes` is what was kept, never the real size. */
export type BoundedBody = { text: string; bytes: number; truncated: boolean }

const encoder = new TextEncoder()

const boundWholeText = (text: string, maxBytes: number): BoundedBody => {
  const encoded = encoder.encode(text)
  if (encoded.length <= maxBytes) return { text, bytes: encoded.length, truncated: false }
  return { text: new TextDecoder().decode(encoded.slice(0, maxBytes)), bytes: maxBytes, truncated: true }
}

/**
 * Reads at most `maxBytes` decoded bytes, bounding slow bodies that keep
 * arriving after the headers. Anything past the bound is left unread and
 * reported as `truncated` - callers must never present a truncated body as a
 * complete one.
 */
export const readBoundedText = async (response: Response, options: BodyOptions = {}): Promise<BoundedBody> => {
  const maxBytes = options.maxBytes ?? HTML_RESPONSE_BYTES
  const scope = abortScope(options.timeoutMs ?? 15_000, options.signal, 'Response body timed out')
  const reader = response.body?.getReader?.()
  const cancel = () => { reader?.cancel().catch(() => {}) }
  scope.signal.addEventListener('abort', cancel, { once: true })
  try {
    throwIfAborted(scope.signal)
    if (!reader) return boundWholeText(await raceAbort(response.text(), scope.signal), maxBytes)
    const decoder = new TextDecoder()
    const parts: string[] = []
    let bytes = 0
    let truncated = false
    for (;;) {
      const chunk = await raceAbort(reader.read(), scope.signal)
      throwIfAborted(scope.signal)
      if (chunk.done) break
      if (bytes >= maxBytes) { truncated = true; break }
      const room = maxBytes - bytes
      const slice = chunk.value.byteLength > room ? chunk.value.slice(0, room) : chunk.value
      truncated = slice.byteLength < chunk.value.byteLength
      parts.push(decoder.decode(slice, { stream: true }))
      bytes += slice.byteLength
      if (truncated) break
    }
    return { text: parts.join('') + decoder.decode(), bytes, truncated }
  } finally {
    cancel()
    scope.signal.removeEventListener('abort', cancel)
    scope.dispose()
  }
}

/** Bounded read that refuses to hand back a partial body as if it were whole. */
export const readResponseText = async (response: Response, options: BodyOptions = {}): Promise<string> => {
  const body = await readBoundedText(response, options)
  if (body.truncated) throw new Error(`Response exceeds ${options.maxBytes ?? HTML_RESPONSE_BYTES} bytes`)
  return body.text
}
