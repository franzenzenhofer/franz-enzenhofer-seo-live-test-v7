// JSON hand-off contract every audit agent emits. Mirrors section 3 of the
// MV3 hardening plan: { agent, summary, findings, metrics, blocking }.

export interface AuditFinding {
  id: string
  severity: 'P0' | 'P1' | 'P2' | 'P3'
  file?: string
  line?: number
  evidence?: string
  fix?: string
}

export interface AuditReport {
  agent: string
  summary: string
  findings: AuditFinding[]
  metrics: Record<string, number | string>
  blocking: boolean
  startedAt: string
  finishedAt: string
}
