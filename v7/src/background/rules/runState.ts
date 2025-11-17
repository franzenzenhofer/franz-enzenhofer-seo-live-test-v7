/**
 * Run State Tracking
 * Tracks metadata for each test run cycle
 */

export type RunStatus = 'pending' | 'running' | 'completed' | 'aborted' | 'error'

export type TriggerReason =
  | 'nav:before'
  | 'nav:commit'
  | 'nav:history'
  | 'dom:idle'
  | 'manual'
  | 'auto'

export interface RunState {
  runId: string
  tabId: number
  url: string
  triggeredBy: TriggerReason
  startedAt: string // ISO timestamp
  completedAt?: string // ISO timestamp
  status: RunStatus
  resultCount?: number
}

/**
 * Generate unique run ID
 */
export const generateRunId = (): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  return `run-${timestamp}-${random}`
}

/**
 * Create new run state
 */
export const createRunState = (
  tabId: number,
  url: string,
  triggeredBy: TriggerReason,
): RunState => {
  return {
    runId: generateRunId(),
    tabId,
    url,
    triggeredBy,
    startedAt: new Date().toISOString(),
    status: 'pending',
  }
}

/**
 * Update run state
 */
export const updateRunState = (
  state: RunState,
  updates: Partial<RunState>,
): RunState => {
  return { ...state, ...updates }
}

/**
 * Mark run as completed
 */
export const completeRunState = (
  state: RunState,
  resultCount: number,
): RunState => {
  return {
    ...state,
    status: 'completed',
    completedAt: new Date().toISOString(),
    resultCount,
  }
}

/**
 * Mark run as aborted
 */
export const abortRunState = (state: RunState): RunState => {
  return {
    ...state,
    status: 'aborted',
    completedAt: new Date().toISOString(),
  }
}
