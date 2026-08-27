const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])
const escapeText = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escapeAttribute = (value: string) => escapeText(value).replace(/"/g, '&quot;')

const openingTag = (element: Element, budget: number): string => {
  const tag = element.tagName.toLowerCase()
  let output = `<${tag}`
  for (let index = 0; index < element.attributes.length; index++) {
    const attribute = element.attributes.item(index)
    if (!attribute) continue
    const next = ` ${attribute.name}="${escapeAttribute(attribute.value.slice(0, 512))}"`
    if (output.length + next.length + 1 > budget) break
    output += next
  }
  return `${output}>`
}

export const boundedOpeningTag = (element: Element, budget = 1_000): string =>
  openingTag(element, budget).slice(0, budget)

const serialize = (node: Node, budget: number, depth: number): string => {
  if (budget <= 0) return ''
  if (node.nodeType === 3) return escapeText((node.nodeValue || '').slice(0, budget)).slice(0, budget)
  if (node.nodeType !== 1) return ''
  const element = node as Element
  const tag = element.tagName.toLowerCase()
  const open = openingTag(element, budget)
  if (VOID_TAGS.has(tag)) return open.slice(0, budget)
  const close = `</${tag}>`
  if (depth >= 12 || open.length + close.length >= budget) return `${open}…${close}`.slice(0, budget)
  let output = open
  for (let index = 0; index < element.childNodes.length; index++) {
    const child = element.childNodes.item(index)
    const remaining = budget - output.length - close.length
    if (remaining <= 1) { output += '…'; break }
    const part = serialize(child, remaining, depth + 1)
    output += part
    if (part.length >= remaining) { output += '…'; break }
  }
  return `${output}${close}`.slice(0, budget)
}

export const boundedOuterHtml = (element: Element | null, budget: number): string =>
  element ? serialize(element, budget, 0) : ''

const serializeClean = (node: Node, budget: number, depth: number): string => {
  if (node.nodeType === 3) {
    const text = node.nodeValue || ''
    return text.trim() ? escapeText(text).slice(0, budget) : ''
  }
  if (node.nodeType !== 1 || depth >= 12) return ''
  const element = node as Element
  const tag = element.tagName.toLowerCase()
  let children = ''
  for (let index = 0; index < element.childNodes.length; index++) {
    const remaining = budget - children.length - tag.length * 2 - 5
    if (remaining <= 0) break
    children += serializeClean(element.childNodes.item(index), remaining, depth + 1)
  }
  if (depth > 0 && !children) return ''
  return `<${tag}>${children}</${tag}>`.slice(0, budget)
}

export const boundedTextHtml = (element: Element | null, budget: number): string => {
  if (!element) return ''
  return serializeClean(element, budget, 0)
}
