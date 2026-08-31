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

### HR experience

- Microsoft-authenticated admin access restricted to approved accounts
- Dashboard, requisition management, and application review
- Applicant search, status management, notes, résumé access, and downloads
- Completed PDF application packages
- Separate EEO, veteran-status, and alcohol/drug agreement PDF records
- Email delivery to the configured HR recipients
- Administrative user access settings

## Accessibility

The applicant flow uses native form controls, programmatic labels, unique field IDs, keyboard-visible focus states, progress semantics, live status announcements, and focus movement when sections change. It also respects the operating system’s reduced-motion preference.

Applicants may use standard assistive technology such as Windows Narrator, Voice Access, macOS VoiceOver, and operating-system dictation. An in-portal **Read this section aloud** control uses the browser’s built-in speech service and provides pause, resume, restart, and stop controls. Application text is not sent to a separate service for read-aloud.

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

## Repository layout

- `src/pages` — public careers, application, and HR admin pages
- `src/components/app` — shared applicant-flow components
- `src/components/steps` — individual application sections
- `src/pages/admin` — HR portal screens
- `src/lib` — validation, draft handling, résumé parsing support, and shared data
- `src/utils` — application document and PDF generation
- `server` — production API, authentication, persistence, email, and submission handling
- `scripts` — regression, document, and workflow tests
- `deploy` — systemd, Nginx, and production environment examples

## Local development

Use Node.js 20 LTS or newer.

```bash
npm install
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
npm run test:pdf-package
npm run test:compliance-pdfs
```

Some browser tests expect Google Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. Override that path with `CHROME_PATH` when needed. Override the preview URL with `TEST_BASE_URL`.

## Production deployment

Production is served by the Node application behind Nginx and managed by systemd. Deployment definitions are in `deploy/`.

Before deploying:

1. Confirm the working tree contains no secrets, generated applications, résumés, or test artifacts.
2. Run all static checks and relevant workflow tests.
3. Build the production bundle.
4. Push the reviewed commit to the intended branch.
5. Update the server checkout and dependencies.
6. Restart `geolabs-employment-portal.service`.
7. Verify the careers page, general application, one job-specific application, Microsoft admin login, and an application download in production.

Do not add `output/`, `tmp/`, production data, uploaded résumés, generated PDF packages, or real `.env` files to Git.

## Operational troubleshooting

- **Applicant cannot resume:** confirm the private link has not expired, `APPLICATION_DATA_DIR` is writable, and the link retains its complete token.
- **Email was not delivered:** verify sender-domain configuration, recipient variables, provider credentials, and server logs.
- **PDF generation failed:** verify the configured LibreOffice binary exists and `PDF_TMP_DIR` is writable.
- **Admin login loops or is denied:** verify the Microsoft callback URL and exact lowercase account in `ADMIN_ALLOWED_EMAILS`.
- **Changes appear locally but not in production:** confirm the production server is on the expected commit, rebuild the Vite bundle, and restart the systemd service.

## Security notes

- Keep all API keys and Microsoft credentials server-side.
- Use a long, unique `ADMIN_SESSION_SECRET` in production.
- Treat continuation links as private bearer credentials.
- Restrict filesystem access to the application data directory.
- Keep voluntary compliance records separate from ordinary hiring decisions.
- Never use real applicant information in fixtures, screenshots, or committed test files.
