import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:https'
import type { AddressInfo } from 'node:net'
import { resolve } from 'node:path'

export const httpResultsFixture = async () => {
  const trash = resolve('../trash')
  mkdirSync(trash, { recursive: true })
  const folder = mkdtempSync(resolve(trash, 'http-results-test-tls-'))
  const key = resolve(folder, 'key.pem')
  const cert = resolve(folder, 'cert.pem')
  writeFileSync(resolve(folder, 'README.md'), 'Temporary self-signed localhost certificate for the HTTP results browser test. Retained here instead of deleted.\n')
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=127.0.0.1'], { stdio: 'ignore' })
  const server = createServer({ key: readFileSync(key), cert: readFileSync(cert) }, (request, response) => {
    if (request.url === '/old') {
      response.writeHead(308, { location: '/trips' })
      response.end()
      return
    }
    response.writeHead(200, { 'content-type': 'text/html' })
    response.end('<!doctype html><title>HTTP result test</title><main><h1>Trips</h1><img src="http://images.http-results.test/alpe-adria.jpg?v=1" alt="Alpe-Adria 8 Tage"><img src="http://images.http-results.test/lanzarote.jpg?v=2" alt="Lanzarote Vulkaninsel"></main><script>history.replaceState({}, "", location.href)</script>')
  })
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  return {
    origin: `https://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done())),
  }
}
