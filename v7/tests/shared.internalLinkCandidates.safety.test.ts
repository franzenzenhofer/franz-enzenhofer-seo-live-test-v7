import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

import { collectInternalLinkCandidates, internalHttpUrl } from '@/shared/internalLinkCandidates'

const PAGE = 'https://blog.test/hello-world/'

// The WordPress admin bar of a logged-in editor, plus ordinary content links.
const html = `<!doctype html><html><body>
  <div id="wpadminbar">
    <a href="/wp-admin/">Dashboard</a>
    <a href="/wp-admin/post.php?post=1&amp;action=edit">Edit Post</a>
    <a href="/wp-login.php?action=logout&amp;_wpnonce=abc">Log Out</a>
  </div>
  <a href="/wp-admin/post.php?post=1&amp;action=trash&amp;_wpnonce=abc">Trash</a>
  <a href="/?add-to-cart=12">Add to cart</a>
  <a href="/about/">About</a>
  <a href="/contact/">Contact</a>
</body></html>`

describe('internal link candidates never include CMS back-office, action or token links', () => {
  it('samples only the ordinary links and counts only those as eligible', () => {
    const doc = new JSDOM(html, { url: PAGE }).window.document
    const { internalLinkCandidates, internalLinkCount } = collectInternalLinkCandidates(doc, 1)
    expect(internalLinkCandidates.map((candidate) => candidate.url).sort()).toEqual([
      'https://blog.test/about/', 'https://blog.test/contact/',
    ])
    expect(internalLinkCount).toBe(2)
  })

  it('filters the offscreen fallback path the same way', () => {
    expect(internalHttpUrl('/wp-login.php?action=logout&_wpnonce=abc', PAGE)).toBeNull()
    expect(internalHttpUrl('/?p=12&preview=true&preview_nonce=abc', PAGE)).toBeNull()
    expect(internalHttpUrl('/about/#team', PAGE)).toBe('https://blog.test/about/')
  })
})
