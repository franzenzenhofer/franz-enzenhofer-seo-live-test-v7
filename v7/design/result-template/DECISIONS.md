# Result-card decisions

Scope: prototype specification. Production extension remains unchanged until the template is accepted.

## Information hierarchy

1. Overview: speaking rule name, status color and accessible icon, actual checked input, immediately visible result and labeled values.
2. Details: selectors, match conditions, criteria, all technical evidence and complete retrieved markup. Do not dumb down or discard technical information.
3. Compact footer: labeled Rule ID, run position and sorting priority. No extra accordion or unexplained P700 / #60 badges.

Use one shared renderer, compact spacing, inline short key/value pairs, and a visibly bordered Details/Hide button. Every form field has a visible associated label. Keep Favorite/Unfavorite, Disable/Enable, Copy, and Open in full report. A favorite star is separate from the status icon.

## Value-field guarantee

A value form field contains only complete original retrieved data, including all markup, attributes, nested content and whitespace. Never truncate, simplify, trim, normalize or reconstruct a value and then present it as original retrieved data.

Completeness and fidelity must be supplied by the capture boundary, not guessed by the renderer. Missing fidelity information, excerpts and derived representations render outside form fields with explicit labels. A report assembled from several findings is also a derived representation, not an original-data form field.

Detail views also show useful extracted text as compact, labeled plain-text rows. For title checks, show `Title: Kyrgyzstan: Trekking the Tien Shan Trails` without tags, in addition to the complete retrieved `<title>` markup. Extracted text is not an original-markup form field. Include these labeled values in copied results as well. Do not invent complete title text from a partial capture.

## URL behavior

- URLs outside original-data fields are clickable, including relative URLs resolved against the tested page URL.
- Ordinary page/resource/destination URLs use neutral text styling, not blue underlining.
- Documentation/reference URLs are blue and underlined.
- URLs inside original-data fields remain literal, non-clickable data. Do not inject links or change the captured string.

## Not applicable is a distinct state

The password-on-HTTP example is not applicable when the tested URL uses HTTPS. This does not report that password fields were checked and passed. The card states the actual checked input and the skipped condition.

Production integration must add a distinct `not_applicable` state (prototype key: `na`) throughout the result contract and interface:

- Neutral gray card and circle-minus icon with accessible name “Not applicable”.
- A separately labeled “Not applicable” option in the result-type/filter menu, with its own count and toggle.
- Include the state in result summaries, sorting, filter persistence, search-by-type, reports and copied/exported results.
- Preserve the distinctions from Information/Observation, Disabled, Checking/Pending, and execution failure/Not checked.
- Unknown or unsupported URL protocols are not evidence that a page uses HTTPS. Applicability must be based on an actually observed input.
- Hiding this filter must not hide ordinary observations or disabled rules.

Gray is also used for inactive execution states, so the label in the filter menu, the icon and the factual execution/applicability value must remain distinct. Do not rely on color alone to distinguish those states.

## State coverage before production integration

Verify passed, failed, warning, information, not applicable, pending, disabled, execution failure, missing capture, partial capture, favorite/unfavorite, disable/enable, copied/copy failure, open report, keyboard menus, focus return, and narrow layouts. Selectors and raw evidence must survive display and copying in every applicable state.

## Mandatory references

Every rule's detail view and copied/exported result includes its documentation reference URLs. Preserve all existing references. Reference links are blue and underlined. Only when a rule has no reference does it link to `https://fullstackoptimization.com/`. An invalid or unavailable supplied reference is not a reason to silently replace it with the fallback; validation must report invalid configuration.
