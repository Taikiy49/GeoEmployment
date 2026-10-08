<div align="center">
  <img src="./public/geolabs-logo.png" alt="Geolabs emblem" width="72" />
  <h1>Geolabs Employment Portal</h1>
  <p><strong>A clearer path from application to hiring.</strong></p>
  <p>The careers and hiring workspace for Geolabs, Inc.<br />Explore openings, complete an application, and manage HR review in one place.</p>
  <p>
    <a href="https://careers.geolabs.net">Careers website</a> ·
    <a href="https://careers.geolabs.net/apply">Apply online</a> ·
    <a href="https://careers.geolabs.net/admin">HR portal</a> ·
    <a href="./docs/OPERATIONS.md">Developer guide</a>
  </p>
  <p>
    <img alt="React 18" src="https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white" />
    <img alt="Vite 6" src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" />
    <img alt="Node.js 24" src="https://img.shields.io/badge/Node.js-24-417E38?logo=nodedotjs&logoColor=white" />
    <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-CSS-0891B2?logo=tailwindcss&logoColor=white" />
  </p>
</div>

---

## Overview

This repository powers **careers.geolabs.net**: the Geolabs careers website, guided employment application, and private HR administration portal.

**Looking for a job?** Visit the [careers website](https://careers.geolabs.net). You do not need a GitHub account or repository access to apply.

## One portal, two experiences

| For applicants | For HR |
| --- | --- |
| Browse openings or start a general application | Create and manage job openings |
| Upload a résumé and review assisted autofill | Search and review submitted applications |
| Complete guided sections with required-field checks | Track application status and internal notes |
| Save progress and request a private continuation link | Access saved résumés and application PDFs |
| Use keyboard navigation and built-in read-aloud | Sign in through Microsoft with approved-account access |
| Receive a submission confirmation | Receive completed packages through configured HR email |

## How it works

1. **Start** — choose an opening or submit a general application.
2. **Complete** — add your details, experience, education, references, and acknowledgments.
3. **Review and submit** — verify imported information and resolve missing required fields.
4. **Deliver** — the server saves the application, generates documents, and sends the configured emails.
5. **Review in HR** — authorized staff manage the submitted record and its files.

### Organized documents

The employer package contains the main application and résumé, with separate **EEO**, **protected-veteran**, and **alcohol/drug agreement** PDFs. Each standalone form has its own page numbering. Voluntary self-identification records remain separate from the supervisor-facing application.

Generated packets use Arial and compact layouts. Blank extra education records and internal processing tables do not print. Existing saved PDFs are not automatically rewritten when code changes.

### Practical safeguards

- **Progress recovery:** browser drafts and expiring, private emailed continuation links.
- **Reliable submission handling:** server validation, duplicate-delivery protection, and delivery warnings.
- **Accessible interaction:** labeled controls, visible keyboard focus, reduced-motion support, and read-aloud controls.
- **Protected HR access:** Microsoft authentication and approved-account checks.

Automated accessibility checks support testing; they do not certify compatibility with every assistive technology.

## Technology

| Layer | Implementation |
| --- | --- |
| Interface | React 18, Vite 6, React Router, Tailwind CSS, Radix UI |
| Server | Node.js 24 |
| Authentication | Microsoft identity platform |
| Email | Microsoft Graph and configured Resend support |
| Documents | DOCX generation, LibreOffice conversion, PDF splitting |
| Storage | Server-side JSON records and files in a durable data directory |
| Production | EC2, Nginx, systemd |

## Run locally

Use **Node.js 24 LTS**.

```bash
git clone https://github.com/Taikiy49/GeoEmployment.git
cd GeoEmployment
npm ci
cp .env.example .env
npm run dev
```

Open [localhost:5173](http://localhost:5173). Email, Microsoft sign-in, server-side persistence, and secure continuation links require the corresponding server configuration.

See the [developer and operations guide](./docs/OPERATIONS.md) for environment setup, testing, PDF rendering, deployment, and troubleshooting.

## Project guide

| Location | Purpose |
| --- | --- |
| [src/pages](./src/pages) | Careers, application, and HR screens |
| [src/components/steps](./src/components/steps) | Guided application sections |
| [src/lib](./src/lib) | Shared validation and application logic |
| [server](./server) | Authentication, storage, and production API |
| [api](./api) | Document generation and supporting handlers |
| [scripts](./scripts) | Workflow and regression checks |
| [deploy](./deploy) | Production configuration templates |
| [DESIGN.md](./DESIGN.md) | Approved visual design |
| [UX-CONTRACT.md](./UX-CONTRACT.md) | Interaction and behavior requirements |

## Checks before release

```bash
npm run typecheck
npm run lint
npm run build
npm run test:unit
```

Browser and PDF tests need additional setup. See [quality checks](./docs/OPERATIONS.md#quality-checks).

> A GitHub push does **not** deploy the EC2 service. Follow the separate [production deployment procedure](./docs/OPERATIONS.md#production-deployment).

## Privacy and access

This is a private company repository maintained by [Taiki Yamashita](https://github.com/Taikiy49). Keep credentials, private continuation links, applicant records, résumés, and generated packets out of Git and issue reports. Use synthetic data for tests and screenshots.

See the [security notes](./docs/OPERATIONS.md#security-notes) for operational safeguards.

---

<div align="center">
  <sub>Geolabs, Inc. · Careers, applications, and HR review in one connected workflow.</sub>
</div>
