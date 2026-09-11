import { presentationSchema } from './schema'
import type { DisplayField, Presentation } from './schema'

export const FALLBACK_REFERENCE = 'https://fullstackoptimization.com/'
export const referenceUrls = (references: string[]) => references.length ? references : [FALLBACK_REFERENCE]
export const textField = (key: string, value: string | number): Extract<DisplayField, { kind: 'text' }> => ({ key, value, kind: 'text' })
export const urlField = (key: string, value: string): DisplayField => ({ key, value, kind: 'url' })
export const pathField = (key: string, value: string): Extract<DisplayField, { kind: 'path' }> => ({ key, value, kind: 'path' })
/** A generated DOM path, or the stated reason as plain text when none exists. */
export const domPathField = (key: string, path: string | null | undefined, missing: string): DisplayField => path ? pathField(key, path) : textField(key, missing)
export const originalField = (key: string, value: string): Extract<DisplayField, { kind: 'original' }> => ({ key, value, kind: 'original', fidelity: 'complete-original' })
type Input = Pick<Presentation, 'name' | 'input' | 'pageUrl' | 'values' | 'checked'> & Partial<Omit<Presentation, 'version'>>
export const createPresentation = (input: Input): Presentation => presentationSchema.parse({
  detailValues: [], evidence: [], markup: [], noMarkup: 'No matching markup retrieved',
  ...input, version: 1, references: referenceUrls(input.references || []),
})
