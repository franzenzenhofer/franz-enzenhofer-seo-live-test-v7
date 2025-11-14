// MOVED TO TRASH (2025-11-14): legacy enhanced result typings were unused after report/types.ts became canonical.
export interface EnhancedResult {
  // Core fields (existing)
  name: string
  label: string
  message: string
  type: string
  priority?: number

  // Enhanced fields
  id?: string // Unique result ID
  ruleId?: string
  timestamp?: number
  runId?: string // ID of the test run

  // Detailed data
  details?: {
    // For title rule
    title?: string
    titleLength?: number

    // For meta description
    description?: string
    descriptionLength?: number

    // For meta tags
    metaTags?: Array<{
      name?: string
      property?: string
      content?: string
      httpEquiv?: string
    }>

    // For headings
    h1s?: string[]
    h2s?: string[]

    // For images
    images?: Array<{
      src?: string
      alt?: string
      width?: string
      height?: string
    }>

    // For links
    links?: Array<{
      href?: string
      text?: string
      rel?: string
      target?: string
    }>

    // For structured data
    structuredData?: unknown[]

    // Generic key-value pairs
    extra?: Record<string, unknown>
  }

  // Execution metadata
  executionTime?: number // ms
  error?: string
  warning?: string
}

export interface TestRun {
  id: string
  timestamp: number
  date: string
  url: string
  totalResults: number
  resultsByType: Record<string, number>
}
