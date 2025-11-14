import { titleRule } from './head/title'
import { metaDescriptionRule } from './head/metaDescription'
import { canonicalRule } from './head/canonical'
import { httpStatusRule } from './http/status'
import { robotsTxtRule } from './robots/robotsTxt'
import { robotsMetaRule } from './head/robotsMeta'
import { hreflangRule } from './head/hreflang'
import { hreflangMultipageRule } from './head/hreflangMultipage'
import { ogTitleRule } from './og/title'
import { ogDescriptionRule } from './og/description'
import { ogUrlRule } from './og/url'
import { ogImageRule } from './og/image'
import { titleLengthRule } from './head/titleLength'
import { metaViewportRule } from './head/metaViewport'
import { brandInTitleRule } from './head/brandInTitle'
import { shortlinkRule } from './head/shortlink'
import { amphtmlRule } from './head/amphtml'
import { ldjsonRule } from './dom/ldjson'
import { metaKeywordsRule } from './head/metaKeywords'
import { metaCharsetRule } from './head/metaCharset'
import { canonicalAbsoluteRule } from './head/canonicalAbsolute'
import { canonicalSelfRule } from './head/canonicalSelf'
import { twitterCardRule } from './head/twitterCard'
import { robotsNoindexRule } from './head/robotsNoindex'
import { gzipRule } from './http/gzip'
import { hstsRule } from './http/hsts'
import { linkHeaderRule } from './http/linkHeader'
import { xRobotsRule } from './http/xRobots'
import { xCacheRule } from './http/xCache'
import { varyUserAgentRule } from './http/varyUserAgent'
import { hasHeaderRule } from './http/hasHeader'
import { soft404Rule } from './http/soft404'
import { canonicalRedirectsRule } from './head/canonicalRedirects'
import { h1Rule } from './body/h1'
import { imagesLayoutRule } from './body/imagesLayout'
import { imagesLazyRule } from './body/imagesLazy'
import { nofollowRule } from './body/nofollow'
import { linkedImagesAltRule } from './a11y/linkedImagesAlt'
import { internalLinksRule } from './body/internalLinks'
import { parameterizedLinksRule } from './body/parameterizedLinks'
import { unsecureInputRule } from './body/unsecureInput'
import { relAlternateMediaRule } from './head/relAlternateMedia'
import { ampCacheUrlRule } from './google/ampCacheUrl'
import { robotsBlockedResourcesRule } from './robots/blockedResources'
import { trailingSlashRule } from './url/trailingSlash'
import { nodeCountRule } from './dom/nodeCount'
import { nodeDepthRule } from './dom/nodeDepth'
import { clientSideRenderingRule } from './dom/clientSideRendering'
import { htmlLangRule } from './dom/htmlLang'
import { linkPreloadRule } from './speed/linkPreload'
import { blockingScriptsRule } from './speed/blockingScripts'
import { preconnectRule } from './speed/preconnect'
import { dnsPrefetchRule } from './speed/dnsPrefetch'
import { googleIsConnectedRule } from './google/isConnected'
import { pageSummaryRule } from './debug/pageSummary'
import { googlebotMetaRule } from './head/googlebotMeta'
import { googlebotUrlCheckRule } from './robots/googlebotUrlCheck'
import { robotsSitemapReferenceRule } from './robots/sitemapReference'
import { robotsComplexityRule } from './robots/complexity'
import { linkedImagesAltNoTextRule } from './a11y/linkedImagesAltNoText'
import { psiMobileRule } from './google/psi/mobile'
import { psiDesktopRule } from './google/psi/desktop'
import { psiMobileFcpTbtRule } from './google/psi/mobileFcpTbt'
import { gscPropertyAvailableRule } from './google/gsc/propertyAvailable'
import { gscIsIndexedRule } from './google/gsc/isIndexed'
import { gscTopQueriesOfPageRule } from './google/gsc/topQueriesOfPage'
import { gscPageWorldwideRule } from './google/gsc/pageWorldwideSearchAnalytics'
import { gscDirectoryWorldwideRule } from './google/gsc/pageDirectoryWorldwideSearchAnalytics'
import { historyStateUpdateRule } from './url/historyStateUpdate'
import { unavailableAfterRule } from './http/unavailableAfter'
import { commonMobileSetupRule } from './http/commonMobileSetup'
import { cacheDeliveryRule } from './http/cacheDelivery'
import { securityHeadersRule } from './http/securityHeaders'
import { httpsSchemeRule } from './http/httpsScheme'
import { http2AdvertisedRule } from './http/http2Advertised'
import { http3AdvertisedRule } from './http/http3Advertised'
import { altSvcOtherProtocolsRule } from './http/altSvcOtherProtocols'
import { topWordsRule } from './dom/topWords'
import { canonicalChainRule } from './head/canonicalChain'
import { schemaArticlePresentRule } from './schema/articlePresent'
import { schemaArticleRequiredRule } from './schema/articleRequired'
import { schemaBreadcrumbRule } from './schema/breadcrumb'
import { schemaEventRule } from './schema/event'
import { schemaFaqRule } from './schema/faq'
import { schemaHowToRule } from './schema/howto'
import { schemaJobPostingRule } from './schema/jobPosting'
import { schemaOrganizationRule } from './schema/organization'
import { schemaProductRule } from './schema/product'
import { schemaRecipeRule } from './schema/recipe'
import { schemaVideoRule } from './schema/video'
import { discoverMaxImagePreviewLargeRule } from './discover/maxImagePreviewLarge'
import { discoverTwitterLargeCardRule } from './discover/twitterLargeCard'
import { discoverArticleStructuredDataRule } from './discover/articleStructuredData'
import { discoverPublishedTimeRule } from './discover/publishedTime'
import { discoverAuthorPresentRule } from './discover/authorPresent'
import { discoverHeadlineLengthRule } from './discover/headlineLength'
import { discoverIndexableRule } from './discover/indexable'
import { discoverCanonicalOkRule } from './discover/canonicalOk'
import { discoverOgImageLargeRule } from './discover/ogImageLarge'
import { discoverPrimaryLanguageRule } from './discover/primaryLanguage'

import type { Rule } from '@/core/types'

export const registry: Rule[] = [
  titleRule,
  metaDescriptionRule,
  canonicalRule,
  httpStatusRule,
  robotsTxtRule,
  robotsMetaRule,
  hreflangRule,
  hreflangMultipageRule,
  ogTitleRule,
  ogDescriptionRule,
  ogUrlRule,
  ogImageRule,
  titleLengthRule,
  metaViewportRule,
  brandInTitleRule,
  shortlinkRule,
  amphtmlRule,
  ldjsonRule,
  metaKeywordsRule,
  metaCharsetRule,
  canonicalAbsoluteRule,
  canonicalSelfRule,
  twitterCardRule,
  robotsNoindexRule,
  gzipRule,
  hstsRule,
  linkHeaderRule,
  xRobotsRule,
  xCacheRule,
  varyUserAgentRule,
  hasHeaderRule,
  soft404Rule,
  canonicalRedirectsRule,
  h1Rule,
  imagesLayoutRule,
  imagesLazyRule,
  nofollowRule,
  linkedImagesAltRule,
  internalLinksRule,
  parameterizedLinksRule,
  unsecureInputRule,
  relAlternateMediaRule,
  ampCacheUrlRule,
  robotsBlockedResourcesRule,
  trailingSlashRule,
  nodeCountRule,
  nodeDepthRule,
  clientSideRenderingRule,
  htmlLangRule,
  linkPreloadRule,
  blockingScriptsRule,
  preconnectRule,
  dnsPrefetchRule,
  googleIsConnectedRule,
  historyStateUpdateRule,
  unavailableAfterRule,
  commonMobileSetupRule,
  httpsSchemeRule,
  http2AdvertisedRule,
  http3AdvertisedRule,
  altSvcOtherProtocolsRule,
  cacheDeliveryRule,
  securityHeadersRule,
  topWordsRule,
  canonicalChainRule,
  pageSummaryRule,
  googlebotMetaRule,
  googlebotUrlCheckRule,
  robotsSitemapReferenceRule,
  robotsComplexityRule,
  linkedImagesAltNoTextRule,
  psiMobileRule,
  psiDesktopRule,
  psiMobileFcpTbtRule,
  gscPropertyAvailableRule,
  gscIsIndexedRule,
  gscTopQueriesOfPageRule,
  gscPageWorldwideRule,
  gscDirectoryWorldwideRule,
  discoverMaxImagePreviewLargeRule,
  discoverTwitterLargeCardRule,
  discoverArticleStructuredDataRule,
  discoverPublishedTimeRule,
  discoverAuthorPresentRule,
  discoverHeadlineLengthRule,
  discoverIndexableRule,
  discoverCanonicalOkRule,
  discoverOgImageLargeRule,
  discoverPrimaryLanguageRule,
  schemaArticlePresentRule,
  schemaArticleRequiredRule,
  schemaBreadcrumbRule,
  schemaEventRule,
  schemaFaqRule,
  schemaHowToRule,
  schemaJobPostingRule,
  schemaOrganizationRule,
  schemaProductRule,
  schemaRecipeRule,
  schemaVideoRule,
]
