// Built-in and not user-editable, deliberately apart from the user blocklist:
// a stored blocklist replaces the defaults (blocklist.ts readBlocklist), so new
// entries there would never reach existing installs.
//
// Why these exist: CMS back offices perform actions through plain GET links
// signed with a session-bound nonce, e.g. WordPress trash links
// (https://developer.wordpress.org/apis/security/nonces/#why-use-a-nonce) and
// logout links (https://developer.wordpress.org/reference/functions/wp_logout_url/).
// WooCommerce adds to the cart on a GET `?add-to-cart=` URL
// (https://woocommerce.com/document/quick-guide-to-woocommerce-add-to-cart-urls/).

/** Exact path segments (case-insensitive, at any depth) that mark a CMS back office. */
export const BACK_OFFICE_SEGMENTS: ReadonlyMap<string, string> = new Map([
  ['wp-admin', 'WordPress admin'],
  ['wp-login.php', 'WordPress login'],
  ['administrator', 'Joomla administrator'],
  ['typo3', 'TYPO3 backend'],
  ['contao', 'Contao backend'],
  ['umbraco', 'Umbraco backoffice'],
  ['sitecore', 'Sitecore backend'],
  ['admin', 'CMS admin area'],
])

/** Matched as the first path segment only: too common a word to match at any depth. */
export const BACK_OFFICE_ROOTS: ReadonlyMap<string, string> = new Map([
  ['ghost', 'Ghost admin'],
])

export const BACK_OFFICE_HOSTS: ReadonlyMap<string, string> = new Map([
  ['admin.shopify.com', 'Shopify admin'],
])

/** Drupal content edit and delete forms: /node/<id>/edit, /node/<id>/delete. */
export const DRUPAL_NODE_ACTION = /^(edit|delete)$/

/** Path segments that perform an action when requested. */
export const ACTION_SEGMENTS: ReadonlySet<string> = new Set([
  'logout', 'log-out', 'logoff', 'log-off', 'signout', 'sign-out', 'unsubscribe',
])

/** Second segment after /cart/ that mutates a shop cart: add, change, clear, update, or a variant:qty permalink. */
export const CART_ACTION = /^(add|change|clear|update)(\.js)?$|^\d+:\d+/

/** Query keys that make the server perform an action on GET. */
export const ACTION_QUERY_KEYS: ReadonlySet<string> = new Set([
  'action', 'task', 'logout', 'unsubscribe',
  'add-to-cart', 'add_to_cart', 'remove_item', 'undo_item', 'empty-cart', 'empty_cart',
  'add_to_wishlist', 'remove_from_wishlist',
])

/** Query keys carrying a session-bound or one-time credential: nonces, CSRF and access tokens. */
export const CREDENTIAL_QUERY_KEY = /nonce|csrf|token/
