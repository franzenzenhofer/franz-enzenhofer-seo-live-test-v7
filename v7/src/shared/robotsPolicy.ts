import type { FetchOnceResult } from './fetchOnce'

export const robotsPolicyState = (response: FetchOnceResult | null): 'rules' | 'allow' | 'unknown' => {
  if (!response) return 'unknown'
  if (response.ok) return 'rules'
  return response.status >= 400 && response.status < 500 && response.status !== 429 ? 'allow' : 'unknown'
}
