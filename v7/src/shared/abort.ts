export const abortReason = (signal: AbortSignal): Error =>
  signal.reason instanceof Error ? signal.reason : new Error('Operation cancelled')

export const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) throw abortReason(signal)
}

export const abortScope = (timeoutMs: number, parent?: AbortSignal, message = 'Request timed out') => {
  const controller = new AbortController()
  const abort = () => controller.abort(parent ? abortReason(parent) : undefined)
  const timer = setTimeout(() => controller.abort(new Error(message)), timeoutMs)
  if (parent?.aborted) abort()
  else parent?.addEventListener('abort', abort, { once: true })
  return {
    signal: controller.signal,
    dispose: () => { clearTimeout(timer); parent?.removeEventListener('abort', abort) },
  }
}

export const raceAbort = <T>(task: Promise<T>, signal: AbortSignal): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const abort = () => reject(abortReason(signal))
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
    task.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort)).catch(reject)
  })
