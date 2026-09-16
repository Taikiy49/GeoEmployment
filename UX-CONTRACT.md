# Geolabs applicant experience contract

## Product context

English-language recruitment for Geolabs roles in Hawaiʻi and California. Applicants browse roles, complete a general or position-specific application, optionally use résumé autofill, recover drafts, review and submit. Accessibility target is keyboard-operable, screen-reader-labelled, responsive UI with WCAG AA contrast; automation is not certification of every assistive technology. Dates are stored as date-only values, not converted through UTC.

## Business-context sources

| Domain / scope | Maintained source | Source type | Reviewed |
|---|---|---|---|
| Applicant and HR workflow | README.md, src/pages/Application.jsx | Product documentation / implementation evidence | 2026-09-15 |
| Permission model | server/admin-auth.js, README.md Security | Server policy implementation | 2026-09-15 |
| Persistence, retry, mail | server/application-store.js, server/ec2-server.js | API implementation / regressions | 2026-09-15 |
| Draft retention | server/draft-store.js | Existing data lifecycle implementation | 2026-09-15 |
| Legal / required fields | src/lib/legalTexts.js, src/lib/applicationValidation.js, server/submission-validation.js | Existing HR-approved content and validation; no new legal interpretation | 2026-09-15 |
| Separate HR documents | api/generate-application-docx.js, api/split-compliance-pdfs.js | Existing document contract | 2026-09-15 |
| Payments and destructive applicant operations | None | Not part of public portal | 2026-09-15 |

This visual refresh does not authorize changes to these policies. It records UI consequences rather than creating a new legal/data policy.

## Visual contract

DESIGN.md documents the public identity. Runtime owner is src/styles/portal.css; the maintained admin Tailwind theme is outside the refresh. Public light theme, reduced-motion and forced-colors variants are supported. Font changes are web-only; PDFs stay Arial. Changes to shared design decisions update both documents and source.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | FormField and ui/select.jsx (Radix) | Controlled application value | Authored applicant popup; existing native admin selectors remain OS-owned | test-design-ui popup width, keyboard and persistence; test:admin |
| Date | FormField native date/month input | lib/localDate.js and server validation | OS-owned picker; ISO date-only storage | test:accessibility; resume-autofill and browser input tests |
| Form | Application, FormField, FormSection, NavigationButtons, ReviewStep | applicationValidation.js and submission-validation.js | Step navigation permits incomplete drafts; Review blocks invalid final submit | test:submission, test:server, test:accessibility |
| Scrollbar | src/styles/portal.css global baseline | Global semantic scrollbar variables | Platform forced-colors, bounded textarea/dropdown, document scrolling | test-design-ui computed styles and overflow |
| Toast | Existing app Toaster; applicant inline statuses | Existing use-toast; action-specific inline state | Critical applicant failures remain inline, not transient only | submission and continue-link failure tests |
| CRUD | Application draft/submission handlers; existing HR routes | API/server persistence policy | Draft updates, idempotent final create; no applicant deletion UI | test:draft, test:secure-drafts, test:submission, test:admin-server |

## Component behavior and dataset navigation

Buttons use semantic elements, visible focus, hover/pressed styles and native disabled states. Labelled fields preserve data; textareas auto-grow then scroll. Career results are the API's bounded published list (up to 100), shown ten at a time with an explicit Load more action. Search/filter are client-side over the complete fetched set, with no remote request per keystroke. Clear restores input focus. Empty data, no-results, loading and failure have distinct messages/recovery. Active search/filter belong in the careers URL; no applicant PII belongs in URLs. Continue-link tokens are removed after restore.

## Flow ledger

| Operation | Trigger | Pending | Success | Failure / focus | Source |
|---|---|---|---|---|---|
| Begin application | Begin Application / Begin General Application | Local stage change | Resume step | Current section receives focus | Application and StepShell |
| Navigate tasks | Continue, Back, named stage/task | Short opacity transition | Same application, retained answers | No submission side effect; section focus | GroupedApplicationStep |
| Upload/autofill | Choose file / Autofill | Existing upload/analysis state | Applicant reviews proposed data | Inline retry; no automatic overwrite of filled values | ResumeStep, resumeAutofill.js |
| Save draft | Automatic on edits | Saving progress | Explicit device-only or secure status | Preserve work and recovery notices | Application, draft-store.js |
| Continue elsewhere | Continue on another device | Sending private link; duplicate blocked | Confirmation and Done | Error stays inside dialog; entered email retained | test:continue-link |
| Final submission | Submit Application | Busy button; stable application reference | Confirmation page | Data retained, safe retry same ID; unknown delivery directs HR | test:submission and test:server |
| Search | Search open positions / department | Immediate local filtering | Result list/count | No-results reset; fetch error retry | JobBoard |

## Navigation and responsive behavior

- `useSEO` owns route titles; job context must not introduce applicant names or tokens into titles.
- Server authentication and permissions are unchanged. Public routes render independently of administrator session lookup, including during lookup failure or delay; protected routes still wait for authentication and fail closed. No public HR-data path is introduced.
- Desktop application rail becomes horizontal stage navigation below 960px; tasks wrap. The document owns vertical scroll; rail is not sticky on short viewports.
- Full important labels and values wrap; result descriptions may be previews only because the linked job details contain full text.
- Focus moves to the incoming section, not an outgoing animation; input targets use scroll-margin to avoid the header. On phones, each incoming task is brought into view immediately without an animated scroll through the page chrome. Submission moves focus to the confirmation page.
- Read-aloud stops on navigation/unmount. Speech support and real OS voices vary; fallback instructions remain.

## Overlays and feedback

The existing continue-link dialog owns focus containment/restoration, Escape, outside dismissal, inert background, body scroll lock and max-height within the visual viewport. A link request is pessimistic; success is shown only after the API responds. It may be closed while sending, but a pending second request is not allowed. Invalid email has an associated visible message.

Public layer tokens are header 30, select 40, modal 60. The existing toast layer 100 remains above these. No nested dialog is introduced. Critical errors remain inline, with non-color text and actionable recovery.

Draft autosave is the existing loss-prevention contract; do not add misleading discard prompts after a confirmed save. Storage failures must not erase in-memory values. This refresh adds no delete or retention action.

## Async and validation

Final create and email remain server-confirmed and idempotent. No optimistic “sent” state. Retry does not create another application ID. Résumé limit remains 2 MB. Server and client validate final required fields independently. Stage navigation is intentionally flexible to let applicants review and recover incomplete drafts. The final Review summary links to the exact missing task; it is not replaced with browser validation bubbles.

Job requests ignore stale/unmounted completions; retry resets the failure state. Client filter edits do not dispatch requests or intercept IME Enter. Existing multi-tab draft timestamp logic and secure draft expiry remain unchanged. Production Microsoft sessions and permissions remain server-enforced.

## Migration ledger

| Slice | Before | Canonical target | Scope / risk | Verification |
|---|---|---|---|---|
| Careers | Overlay hero, floating job cards, ornamental animation | Split real-video masthead, ruled jobs, explicit search recovery | Public visuals and safe read-only loading | test-design-ui and manual desktop/phone screenshots |
| Application shell | Horizontal desktop stages, nested cards, outsized utility panel | Shared numbered rail and readable form panel | No data contract changes | All browser flows and admin regression |
| Fields | Tiny uppercase labels, resizable textareas | FormField semantic labels, 16px inputs, capped auto-grow | Preserve full long answers | accessibility, education, draft, submission tests |
| Welcome | CTA beneath multiple mobile panels | Early CTA, focused preparation and job disclosures | Same entry routes/content | job-specific/general start tests |
| Admin and PDFs | Existing tested versions | Retained, not part of redesign | Run regressions for shared CSS leakage | admin-server and PDF package tests |

Old unreferenced decorative components are removed only within migrated files. Backend/mail/PDF business code is unchanged. Deploy a new release directory; retain previous release override for rollback without replacing persistent data.

## Verification

Static: npm run lint, npm run typecheck, npm run build, designmd lint DESIGN.md and Frontend Design Premium strict audit. Runtime: npm run test:unit, npm run test:browser and npm run test:design-ui against a static preview. Real PDF renderer/font checks run in staged production with synthetic records. Tests intercept email; no real applicant/HR messages.

Matrix: 375/768/1280px, keyboard, authored popup/Escape, long values, no results, network/validation failure, draft reload, reduced motion, saved values and final blockers. Screenshot review supplements programmatic checks. Manual VoiceOver/Narrator, real dictation, physical mobile keyboard and approved Microsoft sign-in remain release acceptance checks, not claims from automated tests.
