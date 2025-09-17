export type EventRec = { t: string; u?: string; h?: Record<string, string | undefined>; s?: number; d?: unknown }
export type Run = { id: number; ev: EventRec[]; domDone?: boolean }

