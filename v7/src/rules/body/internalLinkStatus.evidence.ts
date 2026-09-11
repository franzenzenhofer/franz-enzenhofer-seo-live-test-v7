import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import type { EvidenceRecord } from '@/shared/presentation/schema'
import type { RedirectChain, RedirectHop } from '@/shared/redirectChainTypes'

export type LinkCheck = {
  url: string
  status: number
  domPath: string
  finalUrl?: string
  error?: string
  redirectChain?: RedirectChain
  redirectChainText?: string
  redirectChainHops?: RedirectHop[]
}

const hopsText = (hops: RedirectHop[]) => hops.map((hop, index) =>
  `${index + 1}. ${hop.url} - ${httpStatusLabel(hop.status)}${hop.location ? ` - Location: ${hop.location}` : ''}`).join('\n')

const httpUrlField = (key: string, value: string) => {
  try { return ['http:', 'https:'].includes(new URL(value).protocol) ? urlField(key, value) : textField(key, value) } catch { return textField(key, value || 'Not captured') }
}

export const checkedLinks = (checks: LinkCheck[]): EvidenceRecord[] => checks.map((check, index) => ({
  name: `Link ${index + 1}`,
  fields: [
    httpUrlField('URL', check.url),
    textField('Status', check.error ? 'Request failed' : httpStatusLabel(check.status)),
    ...(check.finalUrl && check.finalUrl !== check.url ? [httpUrlField('Final URL', check.finalUrl)] : []),
    ...(check.error ? [textField('Error', check.error)] : []),
    ...(check.redirectChainText ? [textField('Redirect chain', check.redirectChainText)] : []),
    ...(check.redirectChainHops?.length ? [textField('Redirect hops before failure', hopsText(check.redirectChainHops))] : []),
    textField('DOM path', check.domPath || 'Not captured'),
  ],
}))

export const statusSummaryField = (summary: string) => textField('Status summary', summary || 'Not available')
