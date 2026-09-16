# Geolabs Employment Portal

The Geolabs Employment Portal is the production careers and hiring application for Geolabs, Inc. It publishes job openings, provides a guided employment application, securely delivers completed application packages, and gives authorized HR staff a private administration portal.

## Production URLs

- Careers site: `https://careers.geolabs.net`
- General application: `https://careers.geolabs.net/apply`
- HR administration: `https://careers.geolabs.net/admin`

## What the portal provides

### Applicant experience

- Job-specific and general applications
- Guided, multi-step application with completion checks
- Résumé upload and assisted résumé autofill
- Employment, education, skills, references, and required acknowledgments
- Optional EEO and protected-veteran self-identification
- Alcohol and drug-testing agreement
- Automatic local draft recovery
- Secure emailed “continue application” links for another browser or device
- Applicant confirmation email after successful submission
- Read-aloud controls for each application section
- Responsive, keyboard-friendly layouts with clearer progress navigation and readable fields

### HR experience

- Microsoft-authenticated admin access restricted to approved accounts
- Dashboard, requisition management, and application review
- Applicant search, status management, notes, résumé access, and downloads
- Completed PDF application packages
- Separate EEO, veteran-status, and alcohol/drug agreement PDF records
- Email delivery to the configured HR recipients
- Administrative user access settings

## Accessibility

The applicant flow uses native inputs and accessible authored select controls, programmatic labels, unique field IDs, keyboard-visible focus states, progress semantics, live status announcements, and focus movement when sections change. It also respects the operating system’s reduced-motion preference. The careers video includes a pause control and starts paused when reduced motion is enabled. Résumé uploads have an explicit keyboard-operable file-picker button; long-answer fields grow with their content without cutting off stored answers.

Applicants may use standard assistive technology such as Windows Narrator, Voice Access, macOS VoiceOver, and operating-system dictation. An in-portal **Read this section aloud** control uses the browser’s speech service and provides pause, resume, restart, and stop controls. The portal does not send text to its own speech API; a browser or operating-system voice may use an online service. Applicants should avoid read-aloud on shared speakers when entering private information. Unsupported browsers show a clear fallback message.

Automated tests verify labels, native radio groups, keyboard navigation, repeated-field context, focus, reduced motion, and speech lifecycle with a controlled speech stub. They do **not** certify every real screen reader, dictation product, or installed voice. Manual checks with VoiceOver/Narrator and a keyboard remain part of release acceptance.

The accessibility regression test checks critical applicant-flow semantics:

```bash
npm run test:accessibility
```

## Technology

- React 18 and Vite
- React Router
- Tailwind CSS
- Node.js production server
- Microsoft identity platform for HR authentication
- Microsoft Graph/Resend-backed transactional email delivery
- PDF generation and LibreOffice-based document conversion
- Local server-side JSON storage under the configured application data directory

## Interface design

The public careers site and application use an understated Geolabs visual system: bronze accents, deep blue-green text, clear section rules, and real project footage. Desktop applications have a persistent step rail; narrow screens use compact, scrollable progress navigation. Job searches and department filters are reflected in the URL, with explicit loading, empty, error, and retry states.

- `DESIGN.md` records the visual direction, exact design tokens, typography, and accessibility decisions.
- `UX-CONTRACT.md` records shared component ownership and expected workflow behavior.
- `src/styles/portal.css` is the canonical shared public-interface token and component stylesheet.
- `src/styles/careers.css` and `src/styles/application-start.css` hold page-specific composition.
- Barlow Semi Condensed and Source Sans 3 are version-pinned, self-hosted font packages. Public pages do not depend on a third-party font service. Generated application PDFs continue to use Arial; the web refresh does not change their layout or required wording.
- `premium-ui.json` defines the design audit scope and its required regression commands.

The HR portal retains its own established layout and typography. Shared accessibility fixes must preserve both public and administrative workflows.

## Repository layout

- `src/pages` — public careers, application, and HR admin pages
- `src/components/app` — shared applicant-flow components
- `src/components/steps` — individual application sections
- `src/pages/admin` — HR portal screens
- `src/lib` — validation, draft handling, résumé parsing support, and shared data
- `api/generate-application-docx.js` — server-side application and compliance document generation
- `api/split-compliance-pdfs.js` — independent compliance PDFs with their own page numbering
- `server` — production API, authentication, persistence, email, and submission handling
- `scripts` — regression, document, and workflow tests
- `deploy` — systemd, Nginx, and production environment examples

## Local development

Use Node.js **24 LTS** (`.nvmrc`). Production must use this supported runtime as well.

```bash
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The public careers site and applicant flow work without production credentials; server-backed email, Microsoft login, secure cross-device drafts, and production persistence require the corresponding environment variables.

For a production-like local run:

```bash
npm run build
npm start
```

## Environment configuration

Never commit real credentials. Use `.env.example` for local variable names and `deploy/geolabs-employment-portal.env.example` as the production server template.

Important server variables include:

- `MS_TENANT_ID`, `MS_CLIENT_ID`, and `MS_CLIENT_SECRET` — Microsoft application credentials
- `MS_SENDER_EMAIL` — Microsoft 365 sending mailbox
- `MS_ADMIN_REDIRECT_URI` — Microsoft authentication callback
- `ADMIN_ALLOWED_EMAILS` — comma-separated HR accounts allowed into `/admin`
- `ADMIN_SESSION_SECRET` — long random value used to protect admin sessions
- `HR_APPLICATION_EMAIL` — comma-separated recipients for completed applications
- `APPLICATION_DATA_DIR` — durable server data directory
- `APPLICATION_DRAFT_TTL_DAYS` — secure draft lifetime
- `PUBLIC_SITE_URL` — canonical careers-site URL
- `LIBREOFFICE_BIN` and `PDF_TMP_DIR` — document conversion configuration
- `PDF_FONT_DIR` — installed Arial directory; production uses `/usr/local/share/fonts/geolabs-arial`
- `RELEASE_COMMIT` — deployed Git commit exposed by the read-only `/healthz` endpoint
- `GEMINI_API_KEY` and `GEMINI_RESUME_MODEL` — résumé extraction configuration
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` — transactional email fallback/configuration

After changing production environment values, restart the service so the server receives the new configuration.

## Application data flow

1. The applicant begins a job-specific or general application.
2. Progress is saved in the current browser. If the applicant requests a private continuation link, the draft is also stored server-side under an expiring token.
3. The server validates the final submission and stores the application in `APPLICATION_DATA_DIR`.
4. The server generates the employer PDF package and separate compliance records.
5. HR recipients receive the completed package and résumé; the applicant receives a confirmation email.
6. Authorized HR users can review and manage the same application in `/admin`.

Voluntary self-identification records are generated separately from the supervisor-facing application package. Legacy disability-form draft fields are ignored and removed during normalization; the current applicant flow does not request disability self-identification.

The main application excludes the EEO, protected-veteran, and alcohol/drug agreement pages. Each of those three forms is a standalone PDF with independent page numbering. Generated packets use Arial, compact justified policy text, no contents page, and no printed internal processing tables. Blank extra education records are omitted. Signed records remain in storage; they are not deleted just because internal audit fields are excluded from the printout. Existing saved PDFs are not silently regenerated when code changes.

### Submission and email safeguards

- Résumés are limited to **2 MB**, with the same limit enforced at upload, analysis, draft saving, and final submission. This keeps normal packages within the configured mail provider's direct-attachment limits.
- The server also checks the complete encoded email size. If a package still exceeds the limit, the application remains saved and the error directs the applicant to HR; it is not silently discarded.
- Required fields and acknowledgments are checked on the server, not only in the browser.
- A browser retry retains the same application reference. Already delivered records do not trigger duplicate emails.
- An interrupted send with an unknown outcome is marked for HR review instead of automatically resent. HR can see delivery warnings and retrieve saved files in `/admin`.
- A confirmation-email failure does not erase an application that was delivered to HR.

## Quality checks

Run the core static checks before every push:

```bash
npm run typecheck
npm run lint
npm run build
```

Run workflow regressions against a production preview server:

```bash
npm run preview -- --host 127.0.0.1 --port 4174
```

In a second terminal:

```bash
npm run test:accessibility
npm run test:draft
npm run test:continue-link
npm run test:secure-drafts
npm run test:resume-autofill
npm run test:education
npm run test:jobs
npm run test:admin
npm run test:admin-server
npm run test:pdf-package
npm run test:compliance-pdfs
npm run test:server
npm run test:email-limits
npm run test:submission
npm run test:design-ui
npm run test:public-auth
```

Some browser tests expect Google Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. Override that path with `CHROME_PATH` when needed. Override the preview URL with `TEST_BASE_URL`.

`npm run test:unit` groups isolated backend, résumé, and document-splitting checks. `npm run test:browser` groups browser workflows, including an authenticated admin browser against the real server with isolated storage. These use synthetic data and intercepted email delivery; they do not send real messages. GitHub Actions runs these checks on pushes and pull requests. PDF layout tests require LibreOffice; actual Arial verification also requires the fonts below.

The responsive design suite checks 375px, 768px, and 1280px viewports, focus behavior, menu geometry, readable fields, long answers, saved progress, and incomplete-submission recovery. Set `TEST_SCREENSHOT_DIR` to a temporary directory to retain synthetic screenshots for visual review. Real-device screen-reader and dictation checks remain a separate manual release check.

The public-auth routing suite verifies that delayed or unavailable administrator sign-in services do not block careers or application pages, while protected HR pages continue to require administrator access.

### PDF fonts and rendering

Install `cabextract` and `fontconfig` using the server's package manager, then:

```bash
sudo node scripts/install-pdf-fonts.mjs /usr/local/share/fonts/geolabs-arial
fc-match Arial
PDF_FONT_DIR=/usr/local/share/fonts/geolabs-arial REQUIRE_ARIAL_PDF=1 npm run test:pdf-package
```

The installer verifies the original Microsoft Core Fonts archive checksum and retains its license and original installer. Fonts stay outside public website assets and Git. `fc-match Arial` must resolve Arial, not a substitute. Set `LIBREOFFICE_BIN` if `soffice` is not on PATH. The layout test checks independent numbering, full policy text, required clauses, omitted blank rows/audit tables, long duties across page breaks, and embedded Arial when explicitly required.

## Production deployment

Production is served by the Node application behind Nginx and managed by systemd. Deployment definitions are in `deploy/`.

Before deploying:

1. Confirm the working tree contains no secrets, generated applications, résumés, or test artifacts.
2. Run all static checks and relevant workflow tests.
3. Build the production bundle.
4. Push the reviewed commit to the intended branch.
5. Stage code, lockfile, and built assets in a **new release directory**. Run `npm ci --omit=dev` using Node 24 there. Do not overwrite the active release, credentials, or `/var/lib/geolabs-employment-portal`.
6. Verify the staged release using a temporary data directory and a separate localhost port. Run PDF checks as the service user with the production renderer and fonts.
7. Point the systemd release override at the new directory and Node 24 executable, set `RELEASE_COMMIT` and `PDF_FONT_DIR`, then restart `geolabs-employment-portal.service`. Keep the previous override/release for rollback. Nginx and systemd should allow 360 seconds for document preparation and mail delivery; the server drains in-flight requests on a planned restart.
8. Verify `/healthz` reports the expected commit, current frontend assets load, the careers and application pages work, and unauthenticated admin APIs return 401. An authorized HR user should also verify Microsoft sign-in and an existing application download; do not bypass production authentication for testing.

If verification fails, restore the previous systemd release override and restart. Keep persistent data in its existing location throughout. Never roll back by replacing the live data directory with test data. Successful Git push does not, by itself, deploy this EC2 service.

Do not add `output/`, `tmp/`, production data, uploaded résumés, generated PDF packages, or real `.env` files to Git.

## Operational troubleshooting

- **Applicant cannot resume:** confirm the private link has not expired, `APPLICATION_DATA_DIR` is writable, and the link retains its complete token.
- **Email was not delivered:** verify sender-domain configuration, recipient variables, provider credentials, and server logs.
- **Email delivery needs review:** check the application reference against the shared mailbox before sending another copy. The provider may have accepted the first message despite a lost response. Download the saved files from the portal instead of asking the applicant to start over.
- **PDF generation failed:** verify the configured LibreOffice binary exists and `PDF_TMP_DIR` is writable.
- **Admin login loops or is denied:** verify the Microsoft callback URL and exact lowercase account in `ADMIN_ALLOWED_EMAILS`.
- **Changes appear locally but not in production:** confirm the production server is on the expected commit, rebuild the Vite bundle, and restart the systemd service.

## Security notes

- Keep all API keys and Microsoft credentials server-side.
- Use a long, unique `ADMIN_SESSION_SECRET` in production.
- Treat continuation links as private bearer credentials.
- Restrict filesystem access to the application data directory.
- Maintain access-controlled off-server backups and periodically test restore; a local release rollback is not a data backup.
- Keep voluntary compliance records separate from ordinary hiring decisions.
- Never use real applicant information in fixtures, screenshots, or committed test files.
