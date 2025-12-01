// Moved to trash on 2025-11-26: PageInfo schema unused after removing page-info messaging.
import { z } from 'zod'

export const PageInfo = z.object({
  url: z.string().url(),
  title: z.string().default(''),
  description: z.string().default(''),
  canonical: z.string().url().optional(),
})

export type PageInfoT = z.infer<typeof PageInfo>
