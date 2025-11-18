import { createSchemaRule } from './createSchemaRule'

import { get } from '@/shared/structured'

export const schemaProductRule = createSchemaRule({
  id: 'schema:product',
  name: 'Schema Product',
  types: 'Product',
  validator: (n) => {
    const miss: string[] = []
    if (!get(n, 'name')) miss.push('name')
    const price = get(n, 'offers.price')
    const curr = get(n, 'offers.priceCurrency')
    if (!price) miss.push('offers.price')
    if (!curr) miss.push('offers.priceCurrency')
    return { ok: miss.length === 0, missing: miss }
  },
})

