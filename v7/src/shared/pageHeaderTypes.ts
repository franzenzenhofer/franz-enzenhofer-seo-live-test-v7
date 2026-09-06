export type HeaderHop = {
  url: string
  status?: number
  statusLine?: string
  location?: string
  redirectUrl?: string
  fromCache?: boolean
  ip?: string
  headers?: Record<string, string | undefined>
  headerFields?: Array<[string, string]>
}

export type HeaderResult = {
  headers?: Record<string, string>
  rawHeaders?: Record<string, string | undefined>
  /** Repeated fields kept in wire order; X-Robots-Tag and Link may appear many times. */
  headerFields?: Array<[string, string]>
  /** The main_frame URL these headers were actually received for. */
  headerUrl?: string
  status?: number
  statusLine?: string
  fromCache?: boolean
  ip?: string
  resources: string[]
  hops: HeaderHop[]
}
