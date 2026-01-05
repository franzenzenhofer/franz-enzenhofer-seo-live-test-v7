import { titleRule } from './head/title'
import { metaDescriptionRule } from './head/metaDescription'
import { canonicalRule } from './head/canonical'
import { canonicalHeaderRule } from './head/canonicalHeader'
import { canonicalSignalsConflictRule } from './head/canonicalSignalsConflict'
import { canonicalHttpsPreferenceRule } from './head/canonicalHttpsPreference'
import { canonicalTrackingParamsRule } from './head/canonicalTrackingParams'
import { canonicalNavConsistencyRule } from './head/canonicalNavConsistency'
import { canonicalHreflangConsistencyRule } from './head/canonicalHreflangConsistency'
import { canonicalNoindexConflictRule } from './head/canonicalNoindexConflict'
import { httpStatusRule } from './http/status'
import { robotsTxtRule } from './robots/robotsTxt'
import { robotsMetaRule } from './head/robotsMeta'
import { robotsAgentConflictsRule } from './head/robotsAgentConflicts'
import { robotsOtherMetaRule } from './head/robotsOtherMeta'
import { robotsMetaListRule } from './head/robotsMetaList'
import { robotsNosnippetRule } from './head/robotsNosnippet'
import { robotsMaxSnippetRule } from './head/robotsMaxSnippet'
import { robotsMaxVideoPreviewRule } from './head/robotsMaxVideoPreview'
import { robotsNoImageIndexRule } from './head/robotsNoImageIndex'
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
import { dataNosnippetRule } from './dom/dataNosnippet'
import { parameterizedLinksDiffRule } from './dom/parameterizedLinksDiff'
import { metaKeywordsRule } from './head/metaKeywords'
import { metaCharsetRule } from './head/metaCharset'
import { metaUnavailableAfterRule } from './head/metaUnavailableAfter'
import { twitterCardRule } from './head/twitterCard'
import { robotsNoindexRule } from './head/robotsNoindex'
import { gzipRule } from './http/gzip'
import { mixedContentRule } from './http/mixedContent'
import { hstsRule } from './http/hsts'
import { linkHeaderRule } from './http/linkHeader'
import { xRobotsRule } from './http/xRobots'
import { xCacheRule } from './http/xCache'
import { varyUserAgentRule } from './http/varyUserAgent'
import { headersPresentRule } from './http/headersPresent'
import { hasHeaderRule } from './http/hasHeader'
import { soft404Rule } from './http/soft404'
import { h1Rule } from './body/h1'
import { imagesLayoutRule } from './body/imagesLayout'
import { imagesLazyRule } from './body/imagesLazy'
import { nofollowRule } from './body/nofollow'
import { linkedImagesAltRule } from './a11y/linkedImagesAlt'
import { internalLinksRule } from './body/internalLinks'
import { internalLinkStatusRule } from './body/internalLinkStatus'
import { parameterizedLinksRule } from './body/parameterizedLinks'
import { unsecureInputRule } from './body/unsecureInput'
import { relAlternateMediaRule } from './head/relAlternateMedia'
import { ampCacheUrlRule } from './google/ampCacheUrl'
import { robotsBlockedResourcesRule } from './robots/blockedResources'
import { trailingSlashRule } from './url/trailingSlash'
import { nodeCountRule } from './dom/nodeCount'
import { nodeDepthRule } from './dom/nodeDepth'
import { clientSideRenderingRule } from './dom/clientSideRendering'
import { linkPreloadRule } from './speed/linkPreload'
import { blockingScriptsRule } from './speed/blockingScripts'
import { preconnectRule } from './speed/preconnect'
import { dnsPrefetchRule } from './speed/dnsPrefetch'
import { firstPaintRule } from './speed/firstPaint'
import { googleIsConnectedRule } from './google/isConnected'
import { pageSummaryRule } from './debug/pageSummary'
import { pageObjectRule } from './debug/pageObject'
import { googlebotMetaRule } from './head/googlebotMeta'
import { googlebotUrlCheckRule } from './robots/googlebotUrlCheck'
import { robotsSitemapReferenceRule } from './robots/sitemapReference'
import { robotsComplexityRule } from './robots/complexity'
import { psiMobileRule } from './google/psi/mobile'
import { psiDesktopRule } from './google/psi/desktop'
import { psiMobileFcpTbtRule } from './google/psi/mobileFcpTbt'
import { gscPropertyAvailableRule } from './google/gsc/propertyAvailable'
import { gscIsIndexedRule } from './google/gsc/isIndexed'
import { gscUrlInspectionRule } from './google/gsc/urlInspection'
import { gscTopQueriesOfPageRule } from './google/gsc/topQueriesOfPage'
import { gscPageWorldwideRule } from './google/gsc/pageWorldwideSearchAnalytics'
import { gscDirectoryWorldwideRule } from './google/gsc/pageDirectoryWorldwideSearchAnalytics'
import { historyStateUpdateRule } from './url/historyStateUpdate'
import { unavailableAfterRule } from './http/unavailableAfter'
import { commonMobileSetupRule } from './http/commonMobileSetup'
import { cacheDeliveryRule } from './http/cacheDelivery'
import { fromCacheRule } from './http/fromCache'
import { securityHeadersRule } from './http/securityHeaders'
import { httpsSchemeRule } from './http/httpsScheme'
import { http2AdvertisedRule } from './http/http2Advertised'
import { http3AdvertisedRule } from './http/http3Advertised'
import { altSvcOtherProtocolsRule } from './http/altSvcOtherProtocols'
import { navigationPathRule } from './http/navigationPath'
import { redirectLoopRule } from './http/redirectLoop'
import { redirectEfficiencyRule } from './http/redirectEfficiency'
import { negotiatedProtocolRule } from './http/negotiatedProtocol'
import { redirectCanonicalChainRule } from './http/redirectCanonicalChain'
import { topWordsRule } from './dom/topWords'
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
import { discoverArticleStructuredDataRule } from './discover/articleStructuredData'
import { discoverPublishedTimeRule } from './discover/publishedTime'
import { discoverAuthorPresentRule } from './discover/authorPresent'
import { discoverHeadlineLengthRule } from './discover/headlineLength'
import { discoverIndexableRule } from './discover/indexable'
import { discoverOgImageLargeRule } from './discover/ogImageLarge'
import { discoverPrimaryLanguageRule } from './discover/primaryLanguage'

import type { Rule } from '@/core/types'

export const registry: Rule[] = [
  titleRule,
  metaDescriptionRule,
  canonicalRule,
  canonicalHeaderRule,
  canonicalSignalsConflictRule,
  canonicalHttpsPreferenceRule,
  canonicalTrackingParamsRule,
  canonicalNavConsistencyRule,
  canonicalHreflangConsistencyRule,
  canonicalNoindexConflictRule,
  httpStatusRule,
  robotsTxtRule,
  robotsMetaRule,
  robotsAgentConflictsRule,
  robotsOtherMetaRule,
  robotsMetaListRule,
  robotsNosnippetRule,
  robotsMaxSnippetRule,
  robotsMaxVideoPreviewRule,
  robotsNoImageIndexRule,
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
  dataNosnippetRule,
  parameterizedLinksDiffRule,
  metaKeywordsRule,
  metaCharsetRule,
  metaUnavailableAfterRule,
  twitterCardRule,
  robotsNoindexRule,
  gzipRule,
  mixedContentRule,
  hstsRule,
  linkHeaderRule,
  xRobotsRule,
  xCacheRule,
  varyUserAgentRule,
  headersPresentRule,
  hasHeaderRule,
  soft404Rule,
  h1Rule,
  imagesLayoutRule,
  imagesLazyRule,
  nofollowRule,
  linkedImagesAltRule,
  internalLinksRule,
  internalLinkStatusRule,
  parameterizedLinksRule,
  unsecureInputRule,
  relAlternateMediaRule,
  ampCacheUrlRule,
  robotsBlockedResourcesRule,
  trailingSlashRule,
  nodeCountRule,
  nodeDepthRule,
  clientSideRenderingRule,
  linkPreloadRule,
  blockingScriptsRule,
  preconnectRule,
  dnsPrefetchRule,
  firstPaintRule,
  googleIsConnectedRule,
  pageObjectRule,
  historyStateUpdateRule,
  unavailableAfterRule,
  commonMobileSetupRule,
  httpsSchemeRule,
  http2AdvertisedRule,
  http3AdvertisedRule,
  altSvcOtherProtocolsRule,
  navigationPathRule,
  redirectLoopRule,
  redirectEfficiencyRule,
  negotiatedProtocolRule,
  redirectCanonicalChainRule,
  cacheDeliveryRule,
  fromCacheRule,
  securityHeadersRule,
  topWordsRule,
  pageSummaryRule,
  googlebotMetaRule,
  googlebotUrlCheckRule,
  robotsSitemapReferenceRule,
  robotsComplexityRule,
  psiMobileRule,
  psiDesktopRule,
  psiMobileFcpTbtRule,
  gscPropertyAvailableRule,
  gscIsIndexedRule,
  gscUrlInspectionRule,
  gscTopQueriesOfPageRule,
  gscPageWorldwideRule,
  gscDirectoryWorldwideRule,
  discoverMaxImagePreviewLargeRule,
  discoverArticleStructuredDataRule,
  discoverPublishedTimeRule,
  discoverAuthorPresentRule,
  discoverHeadlineLengthRule,
  discoverIndexableRule,
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
