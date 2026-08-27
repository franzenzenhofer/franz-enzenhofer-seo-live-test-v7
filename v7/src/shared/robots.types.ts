export type RobotsDirective = {
  ua: string
  source: 'meta' | 'header'
  value: string
  tokens: string[]
  hasNoindex: boolean
  hasNofollow: boolean
  tokenCount?: number
  tokensTruncated?: boolean
  domPath?: string
  sourceHtml?: string
  headerKey?: string
}
