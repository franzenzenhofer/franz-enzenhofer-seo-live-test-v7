import { beforeEach, describe, expect, it, vi } from 'vitest'

type InstalledListener = (details: chrome.runtime.InstalledDetails) => void
type MenuProps = { id?: string | number; title?: string; contexts?: string[] }
type ShimOptions = { failCreate?: boolean }

/**
 * Emulates the Chrome behaviour behind the reported bug:
 * - menu items persist across "reloads" (MenuManager restores a service-worker
 *   extension's items on every extension load, onInstalled fires again),
 * - create() with an existing id reports the duplicate through
 *   runtime.lastError inside the callback,
 * - a lastError that is set but never read is an "Unchecked runtime.lastError".
 */
const makeChromeShim = (options: ShimOptions = {}) => {
  const items = new Map<string | number, MenuProps>()
  const installed: InstalledListener[] = []
  const unchecked: string[] = []
  const session: Record<string, unknown> = {}
  let pending: { message: string } | null = null
  let read = false

  const invoke = (message: string | null, cb?: () => void) => {
    pending = message ? { message } : null
    read = false
    cb?.()
    if (pending && !read) unchecked.push(pending.message)
    pending = null
  }

  const shim = {
    runtime: {
      get lastError() { read = true; return pending ?? undefined },
      onInstalled: { addListener: (fn: InstalledListener) => { installed.push(fn) } },
    },
    contextMenus: {
      create: (props: MenuProps, cb?: () => void) => {
        const id = props.id ?? items.size + 1
        if (items.has(id)) { invoke(`Cannot create item with duplicate id ${String(id)}`, cb); return id }
        if (options.failCreate) { invoke('boom', cb); return id }
        items.set(id, props)
        invoke(null, cb)
        return id
      },
      removeAll: (cb?: () => void) => { items.clear(); invoke(null, cb) },
      onClicked: { addListener: () => {} },
    },
    commands: { onCommand: { addListener: () => {} } },
    tabs: { query: async () => [] },
    storage: {
      local: { get: async () => ({}) },
      session: {
        get: async (key: string) => ({ [key]: session[key] }),
        set: async (obj: Record<string, unknown>) => { Object.assign(session, obj) },
      },
    },
  }
  const fireInstalled = async (reason: 'install' | 'update') => {
    for (const fn of installed) fn({ reason } as chrome.runtime.InstalledDetails)
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  return { shim, items, unchecked, session, fireInstalled }
}

const load = async (options?: ShimOptions) => {
  const ctx = makeChromeShim(options)
  // @ts-expect-error test shim
  globalThis.chrome = ctx.shim
  vi.resetModules()
  const { registerCommandAndMenu } = await import('@/background/commands')
  return { ...ctx, registerCommandAndMenu }
}

describe('background commands: open_panel context menu', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('creates the item once on install', async () => {
    const { registerCommandAndMenu, items, unchecked, fireInstalled } = await load()
    registerCommandAndMenu()
    await fireInstalled('install')
    expect([...items.keys()]).toEqual(['open_panel'])
    expect(unchecked).toEqual([])
  })

  it('onInstalled firing again (update / unpacked reload) with persisted items does not duplicate or leak lastError', async () => {
    const { registerCommandAndMenu, items, unchecked, session, fireInstalled } = await load()
    registerCommandAndMenu()
    await fireInstalled('install')
    await fireInstalled('update')
    expect([...items.keys()]).toEqual(['open_panel'])
    expect(unchecked).toEqual([])
    const systemLogs = session['logs:0'] as string[]
    expect(systemLogs.filter((line) => line.includes('contextmenu:installed'))).toHaveLength(2)
  })

  it('registration running twice for one onInstalled still yields a single item', async () => {
    const { registerCommandAndMenu, items, unchecked, fireInstalled } = await load()
    registerCommandAndMenu()
    registerCommandAndMenu()
    await fireInstalled('install')
    expect([...items.keys()]).toEqual(['open_panel'])
    expect(unchecked).toEqual([])
  })

  it('a create failure is read from lastError and reported loudly', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { registerCommandAndMenu, unchecked, session, fireInstalled } = await load({ failCreate: true })
    registerCommandAndMenu()
    await fireInstalled('install')
    expect(unchecked).toEqual([])
    expect(error).toHaveBeenCalledWith('[commands] context menu install failed', expect.objectContaining({ message: 'contextMenus.create: boom' }))
    const systemLogs = session['logs:0'] as string[]
    expect(systemLogs.some((line) => line.includes('contextmenu:install-failed') && line.includes('boom'))).toBe(true)
  })
})
