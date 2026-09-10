import { z } from 'zod'

const key = z.string().trim().min(1)
const url = z.string().url().refine((value) => /^https?:\/\//i.test(value), 'HTTP(S) URL required')
const scalar = z.union([z.string(), z.number().finite()])
const text = z.object({ key, value: scalar, kind: z.literal('text') }).strict()
const link = z.object({ key, value: z.string(), kind: z.literal('url') }).strict()
const original = z.object({ key, value: z.string(), kind: z.literal('original'), fidelity: z.literal('complete-original') }).strict()
export const fieldSchema = z.discriminatedUnion('kind', [text, link, original])
export const presentationSchema = z.object({
  version: z.literal(1), name: key, input: key, pageUrl: z.string(),
  values: z.array(fieldSchema).min(1), detailValues: z.array(fieldSchema),
  checked: z.array(text).min(1),
  evidence: z.array(z.object({ name: key, fields: z.array(fieldSchema).min(1) }).strict()),
  markup: z.array(original), noMarkup: key,
  references: z.array(url).min(1),
}).strict()
export type DisplayField = z.infer<typeof fieldSchema>
export type Presentation = z.infer<typeof presentationSchema>
export type EvidenceRecord = Presentation['evidence'][number]
