import type { Result } from '@/shared/results'

// EnhancedResult just extends Result - details field is now in base Result type
export type EnhancedResult = Result & {
  runId?: string
  timestamp?: number
  executionTime?: number
}