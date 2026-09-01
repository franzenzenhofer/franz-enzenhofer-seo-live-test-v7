import type { FactBucket } from './domFacts.types'

// The background rejects any phase message above 32 KB (see phaseContract),
// so the collector budgets in the SAME unit the contract enforces: UTF-8
// bytes of the serialized payload. Every variable part of the message -
// element facts, parameterized links, document attributes - draws from the
// general pool. Anchors get their own small pool so a fat head plus many
// resources (walked first, in document order) can never starve body anchors
// to zero. Worst case: 24 KB general + 2 KB anchors + envelope < 32 KB.
export const GENERAL_FACT_BYTE_BUDGET = 24_000
export const ANCHOR_FACT_BYTE_BUDGET = 2_000
// Real-world heads run 4-109 elements (~19 KB worst case measured across
// major news/commerce sites) and every one of them can carry an indexing
// directive, so head gets a sub-budget that fits whole heads.
export const HEAD_FACT_BYTE_BUDGET = 20_000
export const PARAMETERIZED_LINK_LIMIT = 12
export const BUCKET_LIMITS: Record<FactBucket, number> = { head: 150, anchor: 10, resource: 20 }

const encoder = new TextEncoder()

export const factByteSize = (value: unknown): number => encoder.encode(JSON.stringify(value)).length
