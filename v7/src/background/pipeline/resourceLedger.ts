import type { EventRec, ResourceLedger } from './types'

import { resourceHeaders, type ResourceFact } from '@/shared/resourceFacts'


export const RESOURCE_LIMITS = { batch: 50, urls: 1_000, bytes: 1_000_000 } as const

/** One webRequest callback reduced to the fields the ledger keeps. */
export type ResourceObservation = {
  t: string; u?: string; type?: string; status?: number; fromCache?: boolean
  error?: string; headers?: Record<string, string>
}

const encoder = new TextEncoder()
const sizeOf = (fact: ResourceFact) => encoder.encode(JSON.stringify(fact)).length
const isTerminal = (t: string) => t === 'req:done' || t === 'req:error'

export const observeResource = (event: EventRec): ResourceObservation => {
  const status = event.s ?? event.sc
  const headers = event.h ? resourceHeaders(event.h) : undefined
  return {
    t: event.t,
    ...(event.u ? { u: event.u } : {}),
    ...(event.resourceType ? { type: event.resourceType } : {}),
    ...(typeof status === 'number' ? { status } : {}),
    ...(typeof event.c === 'boolean' ? { fromCache: event.c } : {}),
    ...(event.error ? { error: event.error } : {}),
    ...(headers && Object.keys(headers).length ? { headers } : {}),
  }
}

export const emptyResourceLedger = (): ResourceLedger =>
  ({ events: 0, completed: 0, errors: 0, facts: [], droppedObservations: 0, truncated: false, bytes: 0 })

const merged = (fact: ResourceFact, observation: ResourceObservation): ResourceFact => ({
  ...fact,
  ...(observation.type ? { type: observation.type } : {}),
  ...(observation.status === undefined ? {} : { status: observation.status }),
  ...(observation.fromCache === undefined ? {} : { fromCache: observation.fromCache }),
  ...(observation.error ? { error: observation.error } : {}),
  ...(observation.headers ? { headers: { ...fact.headers, ...observation.headers } } : {}),
})

/**
 * Merges observations into the bounded ledger. One request fires several
 * callbacks (beforeHeaders, headers, completed): they update ONE fact, count as
 * several EVENTS but never as several resources, and never as several drops.
 * Only a terminal observation (completed/error) whose URL did not fit the
 * bounds is a dropped observation - the honest measure of what is missing.
 */
export const mergeResourceObservations = (ledger: ResourceLedger, batch: ResourceObservation[]): ResourceLedger => {
  const index = new Map(ledger.facts.map((fact, position) => [fact.url, position]))
  for (const observation of batch) {
    ledger.events += 1
    if (observation.t === 'req:done') ledger.completed += 1
    if (observation.t === 'req:error') ledger.errors += 1
    const url = observation.u
    if (!url) continue
    const position = index.get(url)
    if (position !== undefined) {
      const next = merged(ledger.facts[position]!, observation)
      const delta = sizeOf(next) - sizeOf(ledger.facts[position]!)
      if (ledger.bytes + delta > RESOURCE_LIMITS.bytes) continue
      ledger.facts[position] = next
      ledger.bytes += delta
      continue
    }
    const fact = merged({ url }, observation)
    const size = sizeOf(fact)
    if (ledger.facts.length >= RESOURCE_LIMITS.urls || ledger.bytes + size > RESOURCE_LIMITS.bytes) {
      ledger.truncated = true
      if (isTerminal(observation.t)) ledger.droppedObservations += 1
      continue
    }
    index.set(url, ledger.facts.length)
    ledger.facts.push(fact)
    ledger.bytes += size
  }
  return ledger
}
