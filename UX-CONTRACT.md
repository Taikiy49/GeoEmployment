# Geolabs applicant experience contract

## Product context and authority

Applicants browse openings or choose General Application, complete the existing guided application, optionally use résumé autofill, save/recover drafts, review and submit. Authorized HR staff manage applications and receive PDF packages. This is an appearance rollback to `ec5add9`, not a rollback of application data or business features.

Authoritative sources: README.md; src/lib/legalTexts.js and applicationValidation.js; server/submission-validation.js, admin-auth.js, application-store.js and draft-store.js; api/generate-application-docx.js and split-compliance-pdfs.js. Existing permission, retention, email, idempotency and legal policies are unchanged.

## Visual contract

DESIGN.md records the restored appearance. src/index.css and shared Tailwind component classes are canonical. No new portal theme stylesheet or font packages. PDFs remain Arial.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | FormField and ui/select.jsx | Controlled application values | Radix applicant select, native admin selectors | accessibility, education |
| Date | FormField native date/month | localDate.js and validation | OS-owned picker, date-only storage | accessibility, resume-autofill |
| Form | Application, FormField, NavigationButtons, ReviewStep | Client/server validation | Incomplete draft navigation; blocked invalid submission | submission, server |
| Scrollbar | src/index.css and platform baseline | Global CSS | Bounded textarea/select, document scrolling | navigation-stability |
| Toast | Existing Toaster and inline statuses | Existing action state | Critical failures stay inline | submission, continue-link |
| CRUD | Application and existing HR routes | Server persistence and permissions | Idempotent submission; draft updates | draft, secure-drafts, admin-server |

## Navigation and recovery

StepShell immediately replaces keyed tasks and moves focus/scroll once after mount. No section fade-out/fade-in, duplicate IDs or outgoing interactive controls. Editing values must not steal focus. Grouped tasks retain their navigation and previously entered values. Phone navigation brings the incoming form into view; desktop returns to top.

Public routes remain independent of administrator session lookup; protected routes wait and fail closed. Internal home/confirmation-return links use client-side routing. Job loading ignores unmounted responses and times out safely. Original search and filter appearance/behavior is restored.

Continue-link dialog preserves focus trap, Escape, focus restoration, inert background, scroll lock, bounded height and errors. No actual message is reported sent until confirmed by the API. Autosave does not imply server storage without a secure draft.

Submission retains existing validation, busy/duplicate prevention, stable retry ID and recovery. Successful submission focuses confirmation and clears only the submitted draft. Résumé uploads retain keyboard selection and full attachment content. Long duties remain complete and scrollable.

Read-aloud stops on section changes. Controls remain labelled and keyboard operable. Automated tests do not certify all real screen readers or OS dictation.

## Verification

Run lint, typecheck, build, test:unit, test:browser, DESIGN.md lint and strict premium audit. Browser suites include original accessibility/education/draft/continue-link/submission/admin coverage, navigation-stability across phone/desktop and both motion settings, plus production-path public/protected auth routing. All test submissions/email are isolated or mocked. No production applicant records are changed.
