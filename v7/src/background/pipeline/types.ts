export type EventRec = {
  t: string
  u?: string
  h?: Record<string, string | undefined>
  s?: number
  sc?: number
  sl?: string
  c?: boolean
  ip?: string
  ru?: string
  d?: unknown
}
export type ResourceLedger = { urls: string[]; total: number; dropped: number }
export type Run = { id: number; ev: EventRec[]; domDone?: boolean; eventDropped?: number; resources?: ResourceLedger }
