export const CANCELLATION_ERROR = 'rule-run-cancelled'

type PoolOpts<T> = {
  tasks: T[]
  concurrency: number
  signal?: AbortSignal
  run: (task: T) => Promise<void>
}

/**
 * Bounded worker pool. Pulls from a shared cursor so a slow task never
 * blocks tasks queued behind it - only the worker running it.
 */
export const runPool = async <T>({ tasks, concurrency, signal, run }: PoolOpts<T>): Promise<void> => {
  if (!tasks.length) return
  let cursor = 0
  const next = () => (cursor < tasks.length ? tasks[cursor++] : null)
  const worker = async () => {
    while (true) {
      if (signal?.aborted) throw new Error(CANCELLATION_ERROR)
      const task = next()
      if (!task) break
      await run(task)
    }
  }
  const limit = Math.min(concurrency, tasks.length)
  await Promise.all(Array.from({ length: limit }, worker))
}
