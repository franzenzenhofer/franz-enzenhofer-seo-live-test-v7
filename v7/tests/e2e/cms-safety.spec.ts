import { createServer } from 'node:http'
import type { ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'

import { expect, test } from '@playwright/test'

import { readRunSnapshot, withExtension } from './extensionHarness'
import type { RunSnapshot } from './extensionHarness'

// Reproduces the MUEVO report (2026-09-10): a logged-in WordPress editor's
// session cookie rode along on the extension's link probes, so sampled
// wp-admin GET links (trash, logout) were executed. The fixture mimics
// WordPress: an action runs only when the session cookie is present.

type Hit = { method: string; path: string; cookie: string }

const SESSION = { name: 'wordpress_logged_in_e2e', value: 'editor' }
const TRASH_1 = '/wp-admin/post.php?post=1&action=trash&_wpnonce=abc'
const TRASH_2 = '/wp-admin/post.php?post=2&action=trash&_wpnonce=abc'
const LOGOUT = '/wp-login.php?action=logout&_wpnonce=abc'
const ADD_TO_CART = '/?add-to-cart=12'

const doc = (title: string, body = '') =>
  `<!doctype html><html lang="en"><head><title>${title}</title></head><body><h1>${title}</h1>${body}</body></html>`
const links = (hrefs: string[]) => hrefs.map((href) => `<a href="${href}">${href}</a>`).join('\n')

// Exactly five internal links, so the five-link sample takes every one of them.
const PUBLIC_PAGE = doc('Public post', links([TRASH_1, LOGOUT, ADD_TO_CART, '/safe-a', '/safe-b']))
const ADMIN_PAGE = doc('Posts', links([TRASH_1, TRASH_2, LOGOUT]))

const send = (res: ServerResponse, status: number, body: string, headers: Record<string, string> = {}) => {
  res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', ...headers })
  res.end(body)
}

const route = (path: string, loggedIn: boolean, res: ServerResponse) => {
  if (path === '/public') return send(res, 200, PUBLIC_PAGE)
  if (path === '/wp-admin/edit.php') return send(res, 200, ADMIN_PAGE)
  if (path === '/safe-a') return send(res, 200, doc('Safe A'))
  if (path === '/safe-b') return send(res, 302, '', { location: TRASH_2 })
  if (path.startsWith('/wp-admin/')) {
    return loggedIn ? send(res, 200, doc('Moved to the Trash')) : send(res, 302, '', { location: '/wp-login.php?reauth=1' })
  }
  if (path.startsWith('/wp-login.php')) return send(res, 200, doc('Log In'))
  return send(res, 404, doc('Not found'))
}

const startServer = async () => {
  const hits: Hit[] = []
  const server = createServer((req, res) => {
    const path = req.url || '/'
    const cookie = String(req.headers.cookie || '')
    hits.push({ method: req.method || 'GET', path, cookie })
    route(path, cookie.includes(SESSION.name), res)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  const close = () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  return { hits, origin: `http://127.0.0.1:${port}`, close }
}

const withLoggedInEditor = async (path: string, check: (hits: Hit[], snapshot: RunSnapshot) => void, status: string) => {
  const server = await startServer()
  const { context, cleanup } = await withExtension()
  try {
    await context.addCookies([{ ...SESSION, url: server.origin }])
    const url = `${server.origin}${path}`
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'load' })
    let snapshot: RunSnapshot | null = null
    await expect.poll(async () => {
      snapshot = await readRunSnapshot(context, url)
      return snapshot?.status
    }, { timeout: 60_000, intervals: [500, 1_000, 2_000] }).toBe(status)
    // Late probes (redirect tails, slow lanes) must not slip in after the run settles.
    await page.waitForTimeout(3_000)
    check(server.hits, snapshot!)
  } finally {
    await context.close()
    cleanup()
    await server.close()
  }
}

const withCookie = (hits: Hit[]) => hits.filter((hit) => hit.cookie.includes(SESSION.name))
const executedActions = (hits: Hit[]) => withCookie(hits).filter((hit) => hit.path.startsWith('/wp-admin/post.php') || hit.path.startsWith('/wp-login.php?action=logout') || hit.path.includes('add-to-cart='))

test('public page of a logged-in editor: no probe executes a CMS action or carries the session', async () => {
  test.setTimeout(120_000)
  await withLoggedInEditor('/public', (hits, snapshot) => {
    expect(executedActions(hits)).toEqual([])
    const requested = hits.map((hit) => hit.path)
    expect(requested).not.toContain(TRASH_1)
    expect(requested).not.toContain(LOGOUT)
    expect(requested).not.toContain(ADD_TO_CART)
    const safeProbes = hits.filter((hit) => hit.path === '/safe-a')
    expect(safeProbes.length).toBeGreaterThan(0)
    expect(withCookie(safeProbes)).toEqual([])
    // Only the tab's own navigation may carry the editor's session.
    expect(withCookie(hits).map((hit) => hit.path).filter((path) => path !== '/public' && path !== '/favicon.ico')).toEqual([])
    expect(snapshot.results.some((result) => result.ruleId === 'body:internal-link-status')).toBe(true)
  }, 'completed')
})

test('wp-admin page: the audit is skipped and the extension sends nothing', async () => {
  test.setTimeout(120_000)
  await withLoggedInEditor('/wp-admin/edit.php', (hits, snapshot) => {
    expect(snapshot.results.some((result) => result.ruleId === 'system:cms-backend')).toBe(true)
    expect(hits.map((hit) => hit.path).filter((path) => path !== '/wp-admin/edit.php' && path !== '/favicon.ico')).toEqual([])
  }, 'skipped')
})
