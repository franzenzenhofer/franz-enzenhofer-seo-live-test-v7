# Actionable HTTP results

Mixed content remains an error when HTTPS page markup references HTTP resources, even if the browser upgrades or blocks the request. The finding lists each occurrence in page order with its resource type, descriptive label (image alt text where available), full URL, affected attribute, and an attribute selector that also works after compact DOM reconstruction. Network-only URLs are included without double-counting a matching HTML URL. Insecure form actions remain warnings when found alone and stay visible when mixed content is also present.

The side panel and expanded report display numbered offender cards. Copy offender includes the URL, selector and fix; Copy URL and Copy CSS selector provide exact values. Copying the complete result includes all retained offenders as readable Markdown. No requests are made to test the suggested HTTPS endpoints. Large evidence sets remain subject to the existing explicit storage bounds.

Navigation Path Analysis displays one numbered journey with HTTP status names, redirect destinations and plain-language explanations. Captured response headers take precedence over the navigation ledger's status when available. Browser History API events are separate from HTTP redirects, including when the address stays the same. Copy journey and the whole-result copy preserve the sequence. Missing statuses are explicit, and a captured error response at the destination produces an error finding.

References:

- https://www.w3.org/TR/mixed-content/
- https://www.rfc-editor.org/rfc/rfc9110.html#name-status-codes
- https://developers.google.com/search/docs/crawling-indexing/301-redirects
- https://developer.mozilla.org/en-US/docs/Web/API/History/pushState
