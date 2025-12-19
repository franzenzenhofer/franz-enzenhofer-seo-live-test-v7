# TICKET-004 – HTTP/2+ Protocol Detection Rule Verification

## Issue Summary

The `http:negotiated-protocol` rule correctly identified that `https://autoundwirtschaft.at` serves content over **HTTP/1.1** instead of HTTP/2 or HTTP/3, despite using HTTPS.

**Verified on:** 2025-12-19

## Evidence

```javascript
// Performance API result from the target URL
{
  "nextHopProtocol": "http/1.1",
  "url": "https://autoundwirtschaft.at/news/carlos-tavares-nun-buchautor-abrechnung-mit-eu-und-autopolitik",
  "transferSize": 12544,
  "encodedBodySize": 12244
}
```

**Server:** Apache (confirmed via response headers)

## Rule Details

| Field | Value |
|-------|-------|
| Type | `warn` |
| Rule ID | `http:negotiated-protocol` |
| Priority | 300 |
| Message | Network protocol: http/1.1 (HTTPS without HTTP/2+) |
| Reference | [MDN: nextHopProtocol](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/nextHopProtocol) |

## Protocol Hierarchy

The `nextHopProtocol` API returns one of these values:

| Protocol | Status | Performance |
|----------|--------|-------------|
| `http/1.0` | Ancient | Worst |
| `http/1.1` | Legacy | Poor – **This site** |
| `h2` | Modern (2015) | Good – **Minimum target** |
| `h3` | Latest (2022) | Best – **Ideal target** |

**This site uses `http/1.1`** – a 1997 protocol that lacks critical performance optimizations available in modern protocols.

## Why This Matters – The Case for HTTP/2+

### HTTP/2 Benefits (Minimum Recommendation)

1. **Multiplexing** – Multiple requests over single TCP connection (eliminates HTTP/1.1 head-of-line blocking at application layer)
2. **Header Compression (HPACK)** – Reduces redundant header overhead by 85-90%
3. **Binary Protocol** – More efficient parsing than text-based HTTP/1.1
4. **Stream Prioritization** – Critical resources (CSS, JS) load before images
5. **Server Push** – Proactively send resources client will need

### HTTP/3 Benefits (Ideal Recommendation)

HTTP/3 (RFC 9114, June 2022) builds on QUIC/UDP and offers even more:

1. **Eliminates TCP Head-of-Line Blocking** – HTTP/2 multiplexes over TCP, so one lost packet blocks ALL streams. HTTP/3 uses UDP with independent streams – packet loss only affects that stream.
2. **0-RTT Connection Establishment** – Resume connections instantly without handshake. HTTP/2 requires TCP handshake + TLS handshake (2-3 round trips).
3. **Connection Migration** – Seamless handoff when switching networks (WiFi → mobile). HTTP/2 connections break and must restart.
4. **Better Mobile/Lossy Network Performance** – QUIC handles packet loss gracefully. Critical for mobile users.
5. **Built-in Encryption** – TLS 1.3 mandatory, no unencrypted fallback possible.

### Real-World Impact for autoundwirtschaft.at

For a content-heavy news site with many images, ads, and scripts:

| Metric | HTTP/1.1 | HTTP/2 | HTTP/3 |
|--------|----------|--------|--------|
| Concurrent requests | 6 per domain | Unlimited | Unlimited |
| Connection overhead | High | Low | Lowest |
| Mobile performance | Poor | Good | Excellent |
| Packet loss handling | Blocks all | Blocks all (TCP) | Per-stream only |

**Expected improvements:**
- **LCP (Largest Contentful Paint):** 15-30% faster
- **TTFB (Time to First Byte):** 10-20% faster
- **Overall page load:** 20-50% faster on slow/mobile networks

## Root Cause

The site runs on **Apache** server which defaults to HTTP/1.1. Modern protocol support requires explicit configuration.

## Recommendations (Ranked by Impact)

### Option 1: CDN with HTTP/3 (Best – Easiest)

Put a CDN like **Cloudflare** in front of the origin server. This gives you HTTP/3 instantly without touching Apache:

- Free tier available
- Automatic HTTP/3 + HTTP/2 negotiation
- Works even if origin only speaks HTTP/1.1
- Additional benefits: DDoS protection, caching, edge optimization

### Option 2: Enable HTTP/2 on Apache (Good – Quick Fix)

```apache
# Apache configuration to enable HTTP/2
<VirtualHost *:443>
    Protocols h2 h2c http/1.1
    # ... rest of SSL config
</VirtualHost>
```

Or if using `.htaccess` (if allowed by host):
```apache
<IfModule mod_http2.c>
    Protocols h2 h2c http/1.1
</IfModule>
```

**Requirements:**
- Apache 2.4.17+ with `mod_http2` enabled
- PHP-FPM (mod_php doesn't work well with HTTP/2)
- Proper TLS configuration

### Option 3: Upgrade to HTTP/3 Native (Best Performance)

Apache doesn't natively support HTTP/3. Options:
- **nginx** (1.25.0+) with `quic` module
- **LiteSpeed** (native HTTP/3 support)
- **Caddy** (automatic HTTP/3)

Or use CDN (Option 1) which is simpler.

## Browser Support (2025)

| Browser | HTTP/2 | HTTP/3 |
|---------|--------|--------|
| Chrome | ✅ Since 2015 | ✅ Since 2020 |
| Firefox | ✅ Since 2015 | ✅ Since 2021 |
| Safari | ✅ Since 2015 | ✅ Since 2022 |
| Edge | ✅ Since 2015 | ✅ Since 2020 |

**All major browsers support HTTP/3.** There's no reason to stay on HTTP/1.1.

## Status

**VERIFIED** – The rule is working correctly. The warning is legitimate.

**Recommendation:** At minimum upgrade to HTTP/2. Ideally use Cloudflare or similar CDN for instant HTTP/3 support.

---

## Implementation (2025-12-19)

The rule `http:negotiated-protocol` has been upgraded to a three-tier detection system:

| Protocol | Result Type | Priority | Message |
|----------|-------------|----------|---------|
| `http/1.0`, `http/1.1` | **error** (red) | 200 | Outdated. Upgrade to HTTP/2 or HTTP/3. |
| `h2` | **warn** (yellow) | 400 | Consider upgrading to HTTP/3. |
| `h3`, `hq`, `quic` | **ok** (green) | 800 | Optimal performance. |

### Commits
- `7e9bb11` – feat(rules): upgrade HTTP protocol detection to error/warn/ok tiers
- `faefa29` – test(rules): update HTTP protocol tests for new tier system

### Files Changed
- `src/rules/http/negotiatedProtocol.ts` – Rule logic updated
- `tests/rules/http.negotiatedProtocol.test.ts` – Tests updated (4 passing)

---
Created: 2025-12-19
Updated: 2025-12-19 – Added HTTP/3 information and CDN recommendations
Updated: 2025-12-19 – Implemented three-tier detection (error/warn/ok)
