import { extractPSIKey, buildPSIExternalUrl } from '../google-utils'

import { runPSI, getPSIKey } from '@/shared/psi'
import type { Rule } from '@/core/types'

export const psiMobileRule: Rule = {
  id: 'psi:mobile',
  name: 'PSI v5 Mobile score',
  enabled: true,
  what: 'psi',
  async run(page, ctx) {
    const userKey = extractPSIKey(ctx)
    const key = getPSIKey(userKey)
    const j = await runPSI(page.url, 'mobile', key)
    const score = Math.round(((j.lighthouseResult?.categories?.performance?.score || 0) as number) * 100)

    // ⚠️ CRITICAL: DO NOT include full apiResponse in details!
    // Why: Full PSI API response is ~500KB per request containing:
    //   - 14+ base64-encoded screenshots (~25KB each = ~350KB total)
    //   - Full Lighthouse audit descriptions and documentation (~100KB)
    //   - Trace data, network logs, diagnostics (~50KB)
    //   - User agent strings, environment data, etc.
    // Impact: 3 PSI rules × 500KB = 1.5MB bloat in logs and storage
    //
    // What we STRIP OUT (not needed for our results):
    //   ❌ j.lighthouseResult.audits[*].details (screenshots, traces)
    //   ❌ j.lighthouseResult.configSettings
    //   ❌ j.lighthouseResult.i18n (translations)
    //   ❌ j.lighthouseResult.timing
    //   ❌ j.lighthouseResult.environment
    //   ❌ j.loadingExperience.origin_fallback data
    //
    // What we KEEP (essential metrics only):
    const audits = j.lighthouseResult?.audits || {}
    const essentialMetrics = {
      score,
      // Core Web Vitals (Google ranking factors)
      fcp: audits['first-contentful-paint']?.numericValue, // First Contentful Paint
      lcp: audits['largest-contentful-paint']?.numericValue, // Largest Contentful Paint
      cls: audits['cumulative-layout-shift']?.numericValue, // Cumulative Layout Shift
      tbt: audits['total-blocking-time']?.numericValue, // Total Blocking Time
      tti: audits['interactive']?.numericValue, // Time to Interactive
      si: audits['speed-index']?.numericValue, // Speed Index
    }

    // Build external PSI URL so user can view full detailed report with screenshots
    const externalUrl = buildPSIExternalUrl(page.url, 'mobile')

    return {
      label: 'PSI',
      message: `Mobile performance: ${score} - View full report: ${externalUrl}`,
      type: 'info',
      name: "googleRule",
      details: {
        url: page.url,
        strategy: 'mobile',
        externalUrl,
        ...essentialMetrics
      }
    }
  },
}
