import { useEffect } from 'react'

import { subscribeStorage } from '@/shared/storage-multiplex'

type Area = 'local' | 'sync' | 'session' | 'managed'
type Handler = (newValue: unknown, oldValue: unknown, area: Area) => void

// React-friendly subscription to a single storage key. Wraps the
// process-wide multiplexer so multiple components subscribing to the same
// key share a single chrome.storage.onChanged listener.
export const useStorageListener = (key: string, handler: Handler, deps: ReadonlyArray<unknown> = []): void => {
  useEffect(() => {
    const dispose = subscribeStorage(key, handler)
    return dispose
     
  }, [key, ...deps])
}
