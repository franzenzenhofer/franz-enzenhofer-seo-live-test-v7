import { z } from 'zod'

export type NavigationMechanism =
  | 'http_redirect'   // 301, 302, 307, 308
  | 'client_redirect' // <meta http-equiv="refresh">, window.location
  | 'history_api'     // pushState/replaceState
  | 'load'            // Normal page load

export const NavigationHopSchema = z.object({
  url: z.string(),
  timestamp: z.number(),

  type: z.enum(['http_redirect', 'client_redirect', 'history_api', 'load']),

  // HTTP context (for http_redirect and load)
  statusCode: z.number().optional(),
  statusText: z.string().optional(),

  // Browser context
  transitionType: z.string().optional(),
  transitionQualifiers: z.array(z.string()).optional(),
})

export const NavigationLedgerSchema = z.object({
  tabId: z.number(),
  currentUrl: z.string(),
  trace: z.array(NavigationHopSchema),
})

export type NavigationHop = z.infer<typeof NavigationHopSchema>
export type NavigationLedger = z.infer<typeof NavigationLedgerSchema>
