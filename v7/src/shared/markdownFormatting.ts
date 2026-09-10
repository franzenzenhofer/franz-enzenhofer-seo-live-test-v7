export const markdownCode = (value: string): string => {
  const fence = '`'.repeat(Math.max(3, ...Array.from(value.matchAll(/`+/g), (match) => match[0].length + 1)))
  return `${fence}\n${value}\n${fence}`
}
export const escapeMarkdown = (value: string): string => value.replace(/([\\`*_{}[\]<>#+.!|])/g, '\\$1').replace(/[\r\n]+/g, ' ')
