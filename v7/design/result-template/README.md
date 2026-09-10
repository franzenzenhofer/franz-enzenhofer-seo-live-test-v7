# Result-card prototype

Open `index.html`. No server, extension installation or remote assets are required. `tailwind.css` must remain beside the HTML file. All examples are dummy data, not a new live audit.

This proposal changes no extension components or rule behavior.

- Overview: speaking rule name, status color and accessible Lucide icon, checked input (e.g. Static DOM), labeled values.
- Markup values: literal element label followed by the complete markup in a read-only field.
- Details: the same overview plus the exact check, evidence and all retrieved markup, visibly expanded. Markup already displayed in the overview is retained without duplication.
- No advice, recommendations, explanatory essays or repeated status headings.
- The result is visible in the overview before the markup; opening Details is never required to find it.
- Every value has a visible key. Every form field has an associated visible label. Unlabeled overview values are rejected by the shared renderer. Units and absence states are explicit.
- Non-applicable checks are neutral and explicitly say what was not checked.
- Short values sit beside their labels; markup fields retain the label above. Spacing is compact without hiding evidence.
- Details retain Rule ID, run position and sorting priority in a compact labeled footer after the evidence. No extra accordion or unexplained badges.
- Selectors, match conditions and criteria remain explicit technical evidence. Details/Hide is a visibly bordered button.
- Copy includes the rule name, status, page URL, labeled values, check, evidence and full markup regardless of expansion state.

Fourteen selectable examples cover title, brand match, H1, HTTP resource references, parameterized links, non-applicable password checks, image-preview permission, image dimensions, Article entities, navigation, pending, unavailable, disabled and partial-capture states.

Rebuild with `node v7/design/result-template/build.mjs` from the repository root. Styling is generated exclusively from Tailwind utilities. Icons are vendored from Lucide Static 1.44.0 under the adjacent license.

## Interactions

One shared renderer also supplies the Copy, Details/Hide and actions menu for every rule. Favorite/Unfavorite adds or removes a separate filled Lucide star beside the name; the status icon remains unchanged. Disable/Enable affects future runs and preserves existing evidence, with a labeled “Next run: Disabled” row. A disabled rule with no result has an explicit neutral execution state. Open in full report opens all dummy results in a new tab at the selected rule.

The actions menu supports arrow keys, Home/End, Escape, Tab and outside-click dismissal. Favorite and disabled settings persist only in this prototype's local storage. Copy includes complete labeled evidence; if clipboard access fails, a selectable text dialog is provided. All fixtures are illustrative; none start a real audit.

## Value-field integrity

A read-only value field guarantees a complete, unmodified captured value. Preserve all attributes, nested markup, entity spelling, punctuation and whitespace; do not trim, truncate, simplify or reconstruct it. HTML escaping for safe rendering must round-trip to the original value.

The capture boundary supplies `complete-original` provenance. A missing provenance flag never receives that guarantee. Excerpts and reconstructed representations are labeled and rendered as plain text/code, never form fields; their copied representations carry the same labels. Keep complete source evidence in details when available. Do not claim complete markup when the collector retained only a sample or shortened HTML.

Dummy markup fixtures include their full attributes and share the exact same source strings with the overview fields. This contract is implemented in the prototype; applying it to the extension requires verifying its capture boundaries.

See [DECISIONS.md](./DECISIONS.md) for the agreed hierarchy, original-data guarantee, URL styling and required Not applicable filter integration.
