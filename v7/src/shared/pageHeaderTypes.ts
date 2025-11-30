export type HeaderHop = {
  url: string
  status?: number
  statusLine?: string
  location?: string
  redirectUrl?: string
  fromCache?: boolean
  ip?: string
  headers?: Record<string, string | undefined>
}

export type HeaderResult = {
  headers?: Record<string, string>
  rawHeaders?: Record<string, string | undefined>
  status?: number
  statusLine?: string
  fromCache?: boolean
  ip?: string
  resources: string[]
  hops: HeaderHop[]
}
