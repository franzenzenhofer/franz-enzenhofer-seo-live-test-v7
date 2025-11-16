import React from 'react'

export const HelpText = ({
  children,
  expandable = false
}: {
  children: React.ReactNode
  expandable?: boolean
}) => {
  if (expandable) {
    return (
      <details className="mt-2">
        <summary className="text-xs text-blue-600 cursor-pointer">
          ℹ️ More info
        </summary>
        <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-3 rounded">
          {children}
        </div>
      </details>
    )
  }

  return (
    <p className="text-xs text-gray-600 mt-1">
      {children}
    </p>
  )
}
