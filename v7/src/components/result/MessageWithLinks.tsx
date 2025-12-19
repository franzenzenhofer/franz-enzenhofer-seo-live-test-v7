import { useMemo } from 'react'

type Props = { text: string; className?: string }

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g

export const MessageWithLinks = ({ text, className }: Props) => {
  const parts = useMemo(() => {
    const result: (string | { label: string; url: string })[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = LINK_PATTERN.exec(text)) !== null) {
      if (match.index > lastIndex) result.push(text.slice(lastIndex, match.index))
      result.push({ label: match[1] ?? '', url: match[2] ?? '' })
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < text.length) result.push(text.slice(lastIndex))
    return result
  }, [text])

  return (
    <p className={className}>
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          part
        ) : (
          <a key={i} href={part.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {part.label}
          </a>
        )
      )}
    </p>
  )
}
