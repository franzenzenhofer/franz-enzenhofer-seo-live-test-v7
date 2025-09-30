# Rule Enhancement TODO List

## ✅ COMPLETED (10/101)

- [x] src/rules/head/title.ts
- [x] src/rules/head/metaDescription.ts
- [x] src/rules/body/h1.ts
- [x] src/rules/head/canonical.ts
- [x] src/rules/head/robotsMeta.ts
- [x] src/rules/og/title.ts
- [x] src/rules/og/description.ts
- [x] src/rules/og/image.ts
- [x] src/rules/og/url.ts

## 🔄 TODO (91/101)

### a11y (2)
- [ ] src/rules/a11y/linkedImagesAlt.ts
- [ ] src/rules/a11y/linkedImagesAltNoText.ts

### body (5)
- [ ] src/rules/body/imagesLayout.ts
- [ ] src/rules/body/imagesLazy.ts
- [ ] src/rules/body/internalLinks.ts
- [ ] src/rules/body/nofollow.ts
- [ ] src/rules/body/parameterizedLinks.ts
- [ ] src/rules/body/unsecureInput.ts

### debug (1)
- [ ] src/rules/debug/pageSummary.ts

### discover (10)
- [ ] src/rules/discover/articleStructuredData.ts
- [ ] src/rules/discover/authorPresent.ts
- [ ] src/rules/discover/canonicalOk.ts
- [ ] src/rules/discover/headlineLength.ts
- [ ] src/rules/discover/indexable.ts
- [ ] src/rules/discover/maxImagePreviewLarge.ts
- [ ] src/rules/discover/ogImageLarge.ts
- [ ] src/rules/discover/primaryLanguage.ts
- [ ] src/rules/discover/publishedTime.ts
- [ ] src/rules/discover/twitterLargeCard.ts

### dom (6)
- [ ] src/rules/dom/clientSideRendering.ts
- [ ] src/rules/dom/htmlLang.ts
- [ ] src/rules/dom/ldjson.ts
- [ ] src/rules/dom/nodeCount.ts
- [ ] src/rules/dom/nodeDepth.ts
- [ ] src/rules/dom/topWords.ts

### google (10)
- [ ] src/rules/google/ampCacheUrl.ts
- [ ] src/rules/google/gsc/isIndexed.ts
- [ ] src/rules/google/gsc/pageDirectoryWorldwideSearchAnalytics.ts
- [ ] src/rules/google/gsc/pageWorldwideSearchAnalytics.ts
- [ ] src/rules/google/gsc/propertyAvailable.ts
- [ ] src/rules/google/gsc/topQueriesOfPage.ts
- [ ] src/rules/google/isConnected.ts
- [ ] src/rules/google/mft/mobileFriendly.ts
- [ ] src/rules/google/psi/desktop.ts
- [ ] src/rules/google/psi/mobile.ts
- [ ] src/rules/google/psi/mobileFcpTbt.ts

### head (17)
- [ ] src/rules/head/amphtml.ts
- [ ] src/rules/head/brandInTitle.ts
- [ ] src/rules/head/canonicalAbsolute.ts
- [ ] src/rules/head/canonicalChain.ts
- [ ] src/rules/head/canonicalRedirects.ts
- [ ] src/rules/head/canonicalSelf.ts
- [ ] src/rules/head/googlebotMeta.ts
- [ ] src/rules/head/hreflang.ts
- [ ] src/rules/head/hreflangMultipage.ts
- [ ] src/rules/head/metaCharset.ts
- [ ] src/rules/head/metaKeywords.ts
- [ ] src/rules/head/metaViewport.ts
- [ ] src/rules/head/relAlternateMedia.ts
- [ ] src/rules/head/robotsNoindex.ts
- [ ] src/rules/head/shortlink.ts
- [ ] src/rules/head/titleLength.ts
- [ ] src/rules/head/twitterCard.ts

### http (17)
- [ ] src/rules/http/altSvcOtherProtocols.ts
- [ ] src/rules/http/cacheDelivery.ts
- [ ] src/rules/http/commonMobileSetup.ts
- [ ] src/rules/http/gzip.ts
- [ ] src/rules/http/hasHeader.ts
- [ ] src/rules/http/hsts.ts
- [ ] src/rules/http/http2Advertised.ts
- [ ] src/rules/http/http3Advertised.ts
- [ ] src/rules/http/httpsScheme.ts
- [ ] src/rules/http/linkHeader.ts
- [ ] src/rules/http/securityHeaders.ts
- [ ] src/rules/http/soft404.ts
- [ ] src/rules/http/status.ts
- [ ] src/rules/http/unavailableAfter.ts
- [ ] src/rules/http/varyUserAgent.ts
- [ ] src/rules/http/xCache.ts
- [ ] src/rules/http/xRobots.ts

### robots (5)
- [ ] src/rules/robots/blockedResources.ts
- [ ] src/rules/robots/complexity.ts
- [ ] src/rules/robots/googlebotUrlCheck.ts
- [ ] src/rules/robots/robotsTxt.ts
- [ ] src/rules/robots/sitemapReference.ts

### schema (11)
- [ ] src/rules/schema/articlePresent.ts
- [ ] src/rules/schema/articleRequired.ts
- [ ] src/rules/schema/breadcrumb.ts
- [ ] src/rules/schema/event.ts
- [ ] src/rules/schema/faq.ts
- [ ] src/rules/schema/howto.ts
- [ ] src/rules/schema/jobPosting.ts
- [ ] src/rules/schema/organization.ts
- [ ] src/rules/schema/product.ts
- [ ] src/rules/schema/recipe.ts
- [ ] src/rules/schema/video.ts

### speed (4)
- [ ] src/rules/speed/blockingScripts.ts
- [ ] src/rules/speed/dnsPrefetch.ts
- [ ] src/rules/speed/linkPreload.ts
- [ ] src/rules/speed/preconnect.ts

### url (2)
- [ ] src/rules/url/historyStateUpdate.ts
- [ ] src/rules/url/trailingSlash.ts

## Process
1. Enhance rule with sourceHtml extraction
2. Run: `npm run typecheck && npm run lint && npm run test`
3. Fix any errors
4. Commit: `git add <file> && git commit -m "feat(rules): enhance <name>" && git push`
5. Mark as done in this file
6. Move to next rule

## Enhancement Pattern
```typescript
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

// Add to result:
details: {
  sourceHtml: extractHtml(element),
  snippet: extractSnippet(sourceHtml),
  domPath: getDomPath(element),
}
```
