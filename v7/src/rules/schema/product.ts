import { createSchemaRule } from './createSchemaRule'

import { get } from '@/shared/structured'

type Offer = Record<string, unknown>

// offers is commonly an array of Offer objects - unwrap to the first one
const firstOffer = (value: unknown): Offer | undefined => {
  const candidate = Array.isArray(value) ? value[0] : value
  return candidate && typeof candidate === 'object' ? (candidate as Offer) : undefined
}

const hasValue = (value: unknown) => value !== undefined && value !== null && value !== ''

export const schemaProductRule = createSchemaRule({
  id: 'schema:product',
  name: 'Schema Product',
  types: 'Product',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/appearance/structured-data/product-snippet',
      'https://developers.google.com/search/docs/appearance/structured-data/product',
    ],
    description: 'Warns when a Product node lacks name, offers.price, or offers.priceCurrency.',
  },
  validator: (n) => {
    const miss: string[] = []
    if (!get(n, 'name')) miss.push('name')

    // Google requires name plus ONE OF review, aggregateRating, or offers
    if (!n['review'] && !n['aggregateRating'] && !n['offers']) miss.push('review|aggregateRating|offers')

    // When offers exists: price, priceSpecification.price, or lowPrice (AggregateOffer) satisfies it
    const offer = firstOffer(n['offers'])
    if (offer) {
      const price = hasValue(offer['price']) || hasValue(get(offer, 'priceSpecification.price')) || hasValue(offer['lowPrice'])
      if (!price) miss.push('offers.price|priceSpecification.price|lowPrice')
    }
    if (miss.length > 0) return { ok: false, missing: miss }

    // priceCurrency: recommended for product snippets, required only for merchant listings
    if (offer && !hasValue(offer['priceCurrency']) && !hasValue(get(offer, 'priceSpecification.priceCurrency'))) {
      return { ok: false, missing: ['offers.priceCurrency'], failType: 'info', fieldsLabel: 'recommended' }
    }
    return { ok: true }
  },
})
