Removed v7/src/types/robots-txt-parser.d.ts on 2025-09-18

Reason: migrated away from the external `simple-functional-robots-txt-parser` package due to a strict-mode runtime issue (undeclared `hashCode` global). A safe internal parser now lives at `v7/src/vendor/robots.ts`.

No production references remain.

