import { describe, expect, it } from 'vitest'

import { assertSafeProbe, pageSkipMessage, unsafePageReason, unsafeProbeReason, UnsafeProbeError } from '@/shared/probeSafety'

// Never audited and never requested: CMS back offices and URLs that perform an action on GET.
const actionAndBackOffice = [
  'https://site.test/wp-admin/post.php?post=1&action=trash&_wpnonce=abc',
  'https://site.test/wp-admin/',
  'https://site.test/blog/wp-admin/edit.php',
  'https://site.test/WP-ADMIN/index.php',
  'https://site.test/wp-login.php?action=logout&_wpnonce=abc',
  'https://site.test/administrator/index.php?option=com_content',
  'https://site.test/typo3/module/web/layout',
  'https://site.test/contao/main.php',
  'https://site.test/umbraco/#/content',
  'https://site.test/sitecore/shell/',
  'https://site.test/ghost/#/posts',
  'https://site.test/admin/content',
  'https://site.test/de/admin/structure',
  'https://store.myshopify.com/admin/products',
  'https://admin.shopify.com/store/x/products',
  'https://site.test/node/42/edit',
  'https://site.test/node/42/delete',
  'https://site.test/user/logout',
  'https://site.test/account/sign-out',
  'https://site.test/newsletter/unsubscribe',
  'https://site.test/?add-to-cart=12',
  'https://site.test/shop/?remove_item=abc',
  'https://site.test/cart/add?id=123',
  'https://site.test/cart/clear.js',
  'https://site.test/cart/123456:1',
  'https://site.test/index.php?option=com_users&task=user.logout',
  'https://site.test/wiki/index.php?title=X&action=delete',
]

// Audited (the user already opened it) but never requested by the extension itself.
const tokenBearing = [
  'https://site.test/?p=12&preview=true&preview_nonce=abc',
  'https://site.test/verify?token=abc',
  'https://site.test/form?csrf_token=abc',
  'https://site.test/api?access_token=abc',
]

const ordinary = [
  'https://site.test/',
  'https://site.test/blog/admin-guide/',
  'https://site.test/administration-jobs',
  'https://site.test/blog/logout-tips-article',
  'https://site.test/cart',
  'https://site.test/cart/additional-info',
  'https://site.test/search?q=admin',
  'https://site.test/page?actionable=1',
  'https://site.test/tags/ghost/',
  'https://site.test/node/42',
  'https://site.test/products?utm_source=news',
]

describe('probe safety', () => {
  it.each(actionAndBackOffice)('neither audits nor requests %s', (url) => {
    expect(unsafePageReason(url)).not.toBeNull()
    expect(unsafeProbeReason(url)).not.toBeNull()
  })

  it.each(tokenBearing)('audits but never requests %s', (url) => {
    expect(unsafePageReason(url)).toBeNull()
    expect(unsafeProbeReason(url)).toMatch(/^token-bearing URL/)
  })

  it.each(ordinary)('leaves %s alone', (url) => {
    expect(unsafePageReason(url)).toBeNull()
    expect(unsafeProbeReason(url)).toBeNull()
  })

  it('names the reason the user sees', () => {
    expect(unsafeProbeReason('https://site.test/wp-admin/post.php?action=trash')).toBe('WordPress admin (/wp-admin)')
    expect(unsafeProbeReason('https://site.test/?add-to-cart=1')).toBe('action URL (?add-to-cart=)')
    expect(pageSkipMessage('WordPress admin (/wp-admin)')).toMatch(/^Not tested: WordPress admin \(\/wp-admin\)\./)
  })

  it('ignores unparseable input and throws a typed error for unsafe URLs', () => {
    expect(unsafeProbeReason('not a url')).toBeNull()
    expect(() => assertSafeProbe('https://site.test/wp-login.php')).toThrow(UnsafeProbeError)
    expect(() => assertSafeProbe('https://site.test/ok')).not.toThrow()
  })
})
