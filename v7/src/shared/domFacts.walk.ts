type Visit = (node: Node, depth: number) => void

export const walkNodes = (root: Node | null, visit: Visit) => {
  if (!root) return { count: 0, maxDepth: 0 }
  let current: Node | null = root
  let depth = 1
  let count = 0
  let maxDepth = 1
  while (current) {
    visit(current, depth)
    count++
    maxDepth = Math.max(maxDepth, depth)
    if (current.firstChild) {
      current = current.firstChild
      depth++
      continue
    }
    while (current && current !== root && !current.nextSibling) {
      current = current.parentNode
      depth--
    }
    if (!current || current === root) break
    current = current.nextSibling
  }
  return { count, maxDepth }
}

export const normalizedTextLength = (root: Node | null) => {
  let length = 0
  let started = false
  let pendingSpace = false
  walkNodes(root, (node) => {
    if (node.nodeType !== 3) return
    const value = node.nodeValue || ''
    for (let index = 0; index < value.length; index++) {
      if (/\s/.test(value[index]!)) {
        pendingSpace = started
      } else {
        if (pendingSpace) length++
        length++
        started = true
        pendingSpace = false
      }
    }
  })
  return length
}
