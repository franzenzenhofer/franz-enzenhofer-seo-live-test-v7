import { z } from 'zod'

import { httpStatusLabel } from './httpStatusLabel'
import { markdownCode } from './markdownFormatting'

const stepSchema = z.object({
  url: z.string(), type: z.enum(['http_redirect', 'client_redirect', 'history_api', 'load']),
  statusCode: z.number().optional(), target: z.string().optional(),
})
export type NavigationStep = z.infer<typeof stepSchema>
export const readNavigationSteps = (value: unknown): NavigationStep[] => {
  const result = z.array(stepSchema).safeParse(value)
  return result.success ? result.data : []
}
export const navigationStepTitle = (step: NavigationStep): string => {
  if (step.type === 'history_api') return 'Browser history updated'
  if (step.type === 'client_redirect') return 'Client-side redirect'
  return httpStatusLabel(step.statusCode)
}
export const navigationStepMeaning = (step: NavigationStep, previous?: NavigationStep): string => {
  if (step.type === 'history_api') return `${previous?.url === step.url ? 'The address stayed the same. ' : ''}The site updated browser history (pushState/replaceState). This event does not load a new document or add an HTTP redirect.`
  if (step.type === 'client_redirect') return 'Page code navigated the browser here using JavaScript or meta refresh.'
  if (step.statusCode === 308) return 'The server permanently redirects this URL, preserving the request method and body.'
  if (step.statusCode === 301) return 'The server permanently redirects this URL.'
  if ([302, 303, 307].includes(step.statusCode ?? 0)) return 'The server sends the browser to another URL without declaring a permanent move.'
  if (step.type === 'http_redirect') return 'The server redirects this request to another URL.'
  if (step.statusCode === 200) return 'The server successfully returned the page.'
  if ((step.statusCode ?? 0) >= 400) return 'The server returned an error for this URL.'
  return step.statusCode ? 'The server returned this response.' : 'A page navigation was recorded, but its HTTP status was not captured.'
}
export const navigationStepsCopy = (steps: NavigationStep[]): string => steps.map((step, index) => [
  `#### ${index + 1}. ${navigationStepTitle(step)}`,
  `**URL:**\n${markdownCode(step.url)}`,
  navigationStepMeaning(step, steps[index - 1]),
  ...(step.target ? [`**Destination:**\n${markdownCode(step.target)}`] : []),
  ...(step.type === 'http_redirect' && !step.target ? ['Destination not captured.'] : []),
].join('\n\n')).join('\n\n')

export const navigationOutcome = (steps: NavigationStep[]): string => {
  const lastResponse = steps.filter((step) => step.type !== 'history_api').at(-1)
  const historyCount = steps.filter((step) => step.type === 'history_api').length
  return [
    lastResponse?.type === 'load' && lastResponse.statusCode ? `Destination returned ${httpStatusLabel(lastResponse.statusCode)}.` : '',
    historyCount ? `${historyCount} browser history update${historyCount === 1 ? '' : 's'} added no HTTP redirects.` : '',
  ].filter(Boolean).join(' ')
}
