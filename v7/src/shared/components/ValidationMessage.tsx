import type { ValidationResult } from '../validation-types'

export const ValidationMessage = ({
  result
}: {
  result: ValidationResult | null
}) => {
  if (!result) return null

  return (
    <div
      className={`mt-2 text-sm p-2 rounded ${
        result.type === 'success' && 'bg-green-50 text-green-700'
      } ${
        result.type === 'error' && 'bg-red-50 text-red-700'
      } ${
        result.type === 'warning' && 'bg-yellow-50 text-yellow-700'
      }`}
    >
      {result.message}
    </div>
  )
}
