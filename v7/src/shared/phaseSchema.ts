import { z } from 'zod'

export const phaseIdentitySchema = z.object({
  version: z.literal(1), captureId: z.string().min(1).max(100),
  phase: z.enum(['static', 'idle']), url: z.string().url().max(8_192),
  capturedAt: z.number().finite().nonnegative(),
})
export type PhaseIdentity = z.infer<typeof phaseIdentitySchema>

const resultSchema = z.object({
  ruleId: z.string().min(1), name: z.string(), label: z.string(), message: z.string(),
  type: z.enum(['info', 'ok', 'warn', 'error', 'runtime_error', 'pending', 'disabled']),
}).passthrough()
const chunkCount = z.number().int().min(0).max(64)
export const phaseChunkSchema = phaseIdentitySchema.extend({
  chunkIndex: z.number().int().min(0), chunkCount: chunkCount.min(1),
  results: z.array(resultSchema).min(1),
}).refine((data) => data.chunkIndex < data.chunkCount)
export const phaseCompleteSchema = phaseIdentitySchema.extend({
  chunkCount,
  facts: z.object({ phase: z.enum(['static', 'idle']), nodeCount: z.number().nonnegative(), elements: z.array(z.unknown()) }).passthrough(),
}).passthrough().refine((data) => data.facts.phase === data.phase)
