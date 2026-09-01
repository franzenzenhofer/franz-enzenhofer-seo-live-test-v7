import { setRedirectHopObserver } from '@/shared/redirectChainObserver'
import type { ObservedHops, RedirectHop } from '@/shared/redirectChainTypes'

type ProbeReply = { id?: string; hops?: RedirectHop[]; done?: boolean; error?: string } | undefined

const send = async (probe: Record<string, unknown>): Promise<ProbeReply> => {
  const reply = (await chrome.runtime.sendMessage({ channel: 'offscreen', probe })) as ProbeReply
  if (!reply) throw new Error('probe-observer-no-reply')
  if (reply.error) throw new Error(reply.error)
  return reply
}

/**
 * Registers the webRequest-backed redirect hop observer for this offscreen
 * document. Rules keep calling followRedirectChain(); with this installed it
 * asks the service worker (which owns chrome.webRequest) to record the real
 * hops of each probe fetch over the existing offscreen message channel.
 */
export const installProbeHopObserver = (): void => {
  setRedirectHopObserver({
    start: async (url: string): Promise<string> => {
      const reply = await send({ op: 'start', url })
      if (!reply?.id) throw new Error('probe-observer-no-id')
      return reply.id
    },
    stop: async (id: string): Promise<ObservedHops> => {
      const reply = await send({ op: 'stop', id })
      return { hops: reply?.hops ?? [], done: reply?.done === true }
    },
  })
}
