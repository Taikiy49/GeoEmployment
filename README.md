# Geolabs Employment Portal

A Vite and React application for publishing job openings, accepting employment
applications, and reviewing candidates.

## Local development

```bash
npm install
npm run dev
```

No environment variables are required for the local demo. Jobs, drafts,
applications, and administrative changes are stored in the browser's local
storage. This makes the repository self-contained, but it is not a production
database: data does not sync between browsers or devices.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

The public applicant experience is available on the normal host. Admin routes
are shown when the site is served from an `admin.*` hostname.

Production applicant URL: `https://apply.geolabs.net`
