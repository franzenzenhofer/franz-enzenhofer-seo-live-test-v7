import React, { useState } from 'react'

import { validateGSCUrl } from '@/shared/validation'
import { ValidationMessage } from '@/shared/components/ValidationMessage'
import type { ValidationResult } from '@/shared/validation-types'

export const GSCUrlInput = ({
  value,
  onChange
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  const [validation, setValidation] = useState<ValidationResult | null>(null)

  const handleBlur = () => {
    const result = validateGSCUrl(value || '')
    setValidation(result)
  }

  return (
    <div>
      <label className="block">
        <span className="text-sm font-medium text-gray-900">
          Search Console Site URL
        </span>
        <input
          className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          type="text"
          placeholder="https://example.com/ or sc-domain:example.com"
          value={value || ''}
          onChange={onChange}
          onBlur={handleBlur}
        />

        <ValidationMessage result={validation} />

        <p className="text-xs text-gray-600 mt-1">
          Used by Search Console rules (top queries, indexing). Provide the exact property identifier such as
          <code className="mx-1">https://example.com/</code> or <code className="mx-1">sc-domain:example.com</code>.
        </p>
      </label>
    </div>
  )
}
