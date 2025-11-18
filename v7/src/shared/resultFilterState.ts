import { resultTypeOrder } from '@/shared/colors'

export const createDefaultTypeVisibility = () =>
  resultTypeOrder.reduce<Record<string, boolean>>((acc, type) => {
    acc[type] = true
    return acc
  }, {})
