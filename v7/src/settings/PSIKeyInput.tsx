import React, { useState } from 'react'

import { isUsingDefaultPSIKey } from '@/shared/psi'
import { validatePSIKey } from '@/shared/validation'
import { showToast } from '@/shared/components/Toast'
import { ValidationMessage } from '@/shared/components/ValidationMessage'
import type { ValidationResult } from '@/shared/validation-types'

export const PSIKeyInput = ({
  value,
  onChange
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [validating, setValidating] = useState(false)
  const usingDefault = isUsingDefaultPSIKey(value)

  const handleBlur = async () => {
    setValidating(true)

    try {
      const result = await validatePSIKey(value || '')
      setValidation(result)

      if (result.valid && result.type === 'success') {
        showToast('API key validated successfully', 'success')
      }
    } finally {
      setValidating(false)
    }
  }

  return (
    <div>
      <label className="block">
        <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
          PageSpeed Insights Key
          <a
            href="https://developers.google.com/speed/docs/insights/v5/get-started"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 underline"
          >
            Docs
          </a>
          {usingDefault && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
              Using default key
            </span>
          )}
        </span>
        <input
          className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          type="text"
          placeholder="Leave empty to use default key, or enter your own"
          value={value || ''}
          onChange={onChange}
          onBlur={handleBlur}
          disabled={validating}
        />

        <ValidationMessage result={validation} />

        {validating && (
          <p className="text-xs text-gray-600 mt-1 italic">
            Validating API key...
          </p>
        )}

        {!validating && (
          <p className="text-xs text-gray-600 mt-1">
            {usingDefault
              ? 'Currently using the default PSI API key. You can enter your own Google Cloud API key to override.'
              : 'Using your custom PSI API key. Clear this field to use the default key.'
            }
          </p>
        )}
      </label>
    </div>
  )
}
