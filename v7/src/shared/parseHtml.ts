type ParserHost = { DOMParser?: typeof DOMParser } | null | undefined

/**
 * Parse an HTML string in any of the runtimes rules execute in.
 * The offscreen document has DOMParser as a global; the CLI runs under jsdom,
 * which exposes it on the document's window instead. Resolving it from the
 * reference document keeps rules runtime-agnostic.
 */
export const parseHtmlDocument = (html: string, reference?: Document): Document => {
  const Parser = typeof DOMParser !== 'undefined'
    ? DOMParser
    : (reference?.defaultView as ParserHost)?.DOMParser
  if (!Parser) throw new Error('No HTML parser available in this runtime')
  return new Parser().parseFromString(html, 'text/html')
}
