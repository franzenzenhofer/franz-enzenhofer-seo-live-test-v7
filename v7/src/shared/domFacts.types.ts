export type DomPhase = 'static' | 'idle'

export type DomElementFact = {
  location: 'head' | 'body'
  tag: string
  attrs: Array<[string, string]>
  text?: string
}

export type DomPhaseFacts = {
  phase: DomPhase
  nodeCount: number
  maxDepth: number
  textLength: number
  scriptCount: number
  blockingScriptCount: number
  parameterizedLinkCount: number
  parameterizedLinks: string[]
  parameterizedLinksTruncated: boolean
  elements: DomElementFact[]
  elementsTruncated: boolean
  documentAttributes: Array<[string, string]>
}
