import type { Result } from '@/shared/results'

export interface EnhancedResult extends Result {
  details?: {
    title?: string
    titleLength?: number
    description?: string
    descriptionLength?: number
    metaTags?: Array<{
      name?: string
      property?: string
      content?: string
    }>
    h1s?: string[]
    h2s?: string[]
    images?: Array<{
      src?: string
      alt?: string
      width?: string
      height?: string
    }>
    links?: Array<{
      href?: string
      text?: string
      rel?: string
    }>
    structuredData?: unknown[]
    extra?: Record<string, unknown>
  }
  runId?: string
  timestamp?: number
  executionTime?: number
}