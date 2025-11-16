import { extractPSIKey, buildPSIExternalUrl } from '../google-utils'

import { runPSI, getPSIKey } from '@/shared/psi'
import type { Rule } from '@/core/types'

export const psiMobileFcpTbtRule: Rule = {
  id: 'psi:mobile-fcp-tbt',
  name: 'PSI v5 Mobile FCP/TBT',
  enabled: true,
  what: 'psi',
  async run(page, ctx) {
    const userKey = extractPSIKey(ctx)
    const key = getPSIKey(userKey)
    const j = await runPSI(page.url, 'mobile', key)

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
    const fcp = audits['first-contentful-paint']?.numericValue
    const tbt = audits['total-blocking-time']?.numericValue
    const lcp = audits['largest-contentful-paint']?.numericValue
    const cls = audits['cumulative-layout-shift']?.numericValue
    const tti = audits['interactive']?.numericValue
    const si = audits['speed-index']?.numericValue

    // Build user-friendly message showing key metrics
    const parts = [
      typeof fcp === 'number' ? `FCP ${Math.round(fcp)}ms` : null,
      typeof tbt === 'number' ? `TBT ${Math.round(tbt)}ms` : null
    ].filter(Boolean)

    // Build external PSI URL so user can view full detailed report with screenshots
    const externalUrl = buildPSIExternalUrl(page.url, 'mobile')

    return {
      label: 'PSI',
      message: `${parts.join(', ') || 'Metrics unavailable'} - View full report: ${externalUrl}`,
      type: 'info',
      name: "googleRule",
      details: {
        url: page.url,
        strategy: 'mobile',
        externalUrl,
        // Core Web Vitals (Google ranking factors)
        fcp, // First Contentful Paint
        lcp, // Largest Contentful Paint
        cls, // Cumulative Layout Shift
        tbt, // Total Blocking Time
        tti, // Time to Interactive
        si,  // Speed Index
      }
    }
  },
}
