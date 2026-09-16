---
version: alpha
name: Geolabs Careers
description: An engineering fieldbook for finding a role and completing an employment application.
colors:
  primary: "#955629"
  ink: "#172c34"
  muted: "#52656d"
  paper: "#f4f6f5"
  surface: "#ffffff"
  line: "#cbd5d8"
  bronze: "#955629"
  bronze-hover: "#77411e"
  bronze-soft: "#f5eee8"
  success: "#28634c"
  danger: "#b42332"
typography:
  body:
    fontFamily: "Source Sans 3 Variable, Segoe UI, sans-serif"
    fontSize: "16px"
    lineHeight: "1.5"
  display:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, sans-serif"
rounded:
  DEFAULT: "6px"
spacing:
  section: "24px"
  page-max: "1200px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.DEFAULT}"
  button-primary-hover:
    backgroundColor: "{colors.bronze-hover}"
    textColor: "{colors.surface}"
  label:
    textColor: "{colors.ink}"
  eyebrow:
    textColor: "{colors.bronze}"
  hint:
    textColor: "{colors.muted}"
  background:
    backgroundColor: "{colors.paper}"
  divider:
    backgroundColor: "{colors.line}"
  progress-active:
    backgroundColor: "{colors.bronze-soft}"
    textColor: "{colors.bronze-hover}"
  saved-status:
    textColor: "{colors.success}"
  invalid:
    textColor: "{colors.danger}"
  input:
    typography: "{typography.body}"
    rounded: "{rounded.DEFAULT}"
  dialog:
    rounded: "{rounded.DEFAULT}"
---

# Geolabs Careers Design System

## Overview

### Creative North Star

An engineering practice's fieldbook: precise rules, comfortable reading, numbered stages, and actual work on site. The existing Geolabs mark and bronze remain recognizable. This is not a technology-product launch page.

- Audience: first-time applicants for field, laboratory, drilling and engineering roles; HR receives their completed records.
- Market and evidence: Hawaiʻi and California, English-language recruitment, as described in README.md and maintained job records. Hawaiian place names retain their diacritics. No Japanese-market assumption is made from a person's surname.
- Usage: occasional, consequential form completion on desktop or phone; long answers must remain readable and recoverable.
- Register: hybrid. `/` has a composed editorial masthead and actual field video; `/apply` and `/apply/:id` are quiet task workspaces.
- Signature: the real fieldwork video beside tall, condensed engineering typography. The application echoes this with a numbered left-hand progress rail.
- Restraint: form labels, compliance language, error messages and navigation use familiar controls, not ornamental design.
- Anti-references: AI-startup gradients/glowing blobs, animated statistic cards, tiny uppercase form labels, floating cards around every paragraph, celebratory motion during data entry.
- Ownership: **Model B**, runtime CSS is canonical. `src/styles/portal.css` owns public tokens; this file mirrors accepted values. Existing Tailwind/shadcn admin tokens remain separate, not silently rebranded. Shared scrollbars are the intentional global exception.

## Colors

Ink is the primary reading color; muted text is for supporting instructions. Paper is a cool mineral gray, not a warm cream theme. White is a real working surface. Bronze is reserved for primary actions, active navigation and small editorial labels. Borders separate information without shadows. Success/error colors are accompanied by text or icons.

The public portal is light-only. No theme toggle is implied. Forced-colors mode defers contrast to platform colors and retains visible selection/focus. Native browser pickers remain platform-owned.

## Typography

Barlow Semi Condensed 500/600 gives primary headings a practical engineering-drawing character. Source Sans 3 uses 400–650 for body, labels and controls. Fonts are self-hosted through pinned OFL Fontsource packages, with system fallbacks; no external font request accompanies applicant data.

Body is 16px/1.5; labels 14px/1.4, help 13px/1.45, input values 16px/24px. Large form headings are 28–30px. Uppercase is reserved for short section eyebrows, never ordinary field labels. Long headings and labels wrap. Financial/date metadata use tabular figures where useful; no decorative monospaced micro-labels.

The PDF packet remains Arial and is generated independently. Web typography must not change employer PDFs or legal wording.

## Layout

The shared header, footer, and application max width is 1200px including 32px gutters. The careers editorial masthead intentionally breaks out to 1440px, with its job-list section bounded at 1280px. On phones gutters are 16–20px. The application uses a 226px stage rail, 32px gap and flexible form panel at 960px and above. Below that, stages scroll horizontally with a visible scrollbar and the current stage is kept in view; sub-tasks wrap. Phone task navigation brings the incoming form into view below the header, so repeated tasks do not require scrolling through the page chrome again.

The document owns vertical scrolling. No fixed-height form viewport. At short screens, the rail stops being sticky so every step remains reachable. Labels and errors may grow naturally. Form content is 32px inset on desktop and 20px on phones. Initial application action comes before lengthy supporting details. Actions remain in normal flow on phones to avoid obscuring the virtual keyboard.

## Elevation & Depth

Static content is flat: surfaces, fine rules and whitespace establish hierarchy. A small shadow is allowed only for an actual overlay (select or dialog). No radial glow, frosted content card or hover-lifting job row. The header has a solid surface to keep focus and text clear.

## Shapes

Controls and working surfaces share a 6px corner radius. Primary section dividers are straight. Numbers and native radios may be circular because their meaning calls for it. Do not turn all metadata into badges.

## Components

### Runtime mapping

| Document token | Runtime owner | Adapter / consumers |
|---|---|---|
| `colors.ink`, `muted`, `paper`, `surface`, `line` | `--portal-ink`, `--portal-muted`, `--portal-paper`, `--portal-surface`, `--portal-line` | semantic CSS in portal.css, careers.css, application-start.css |
| `colors.bronze`, `bronze-hover`, `bronze-soft` | matching `--portal-*` variables | `.portal-button`, active progress, form focus, careers links |
| `colors.success`, `danger` | `--portal-success`, `--portal-danger` | save status and invalid fields |
| `typography.body`, `display` | `--portal-font-body`, `--portal-font-display` | `.portal-theme`, field controls, form headings; fonts imported by main.jsx |
| `rounded.DEFAULT` | `--portal-radius` | shared buttons, fields, panel, dialog and popup |
| `spacing.section`, `page-max` | `--portal-space`, `--portal-page-max` | page shell and shared composition |

CSS remains the value owner. Update this mirror and its runtime owner together. `scripts/test-design-ui.mjs` exercises representative computed styles, responsive overflow and popup geometry; run the DESIGN.md linter after changes. Do not duplicate token values in a new Tailwind theme.

### Foundational states

Primary buttons: bronze → deeper bronze hover → ink pressed. Secondary controls: white with line border → paper and stronger border. Every control has an offset bronze focus outline and a pointer cursor when enabled. Disabled controls retain geometry and use native disabled behavior. Busy controls keep labels, display activity and block duplicates. Invalid fields use red borders **and** associated text. Pending server work is not called successful before confirmation.

### Navigation and forms

Header: Geolabs identity and a real Open positions link. No empty hamburger. Footer: actual contact/location context. Progress uses stage names and numbers, not color alone. A check means a visited stage, not a claim all required answers are valid; Review provides the authoritative blockers.

FormField owns text/date/month/select/textarea labels and spacing. Radix owns authored select interaction; trigger and popup outer widths match within 1 CSS px. Native date/month picker appearance and language are accepted. Textareas auto-grow to 360px and then visibly scroll, never truncate stored text. Long answers remain available.

Read-aloud is an understated utility above form content, not the dominant page CTA. Continue-link dialog has an inert background, focus trap, Escape/close, restored trigger focus and bounded scrolling. Error text stays beside its action. Native forms use `noValidate` and established application validation.

### Iconography, motion and content

Lucide line icons, generally 14–20px; icons support real actions and never replace labels. Static job lists need no decorative icon containers. Form transitions are brief opacity changes (120ms); reduced motion is immediate. Video has a visible pause/play control and does not autoplay under reduced motion. No new confetti or bounce.

Voice: direct, reassuring and specific. Do not invent benefits, certifications, testimonials, statistics or legal promises. Keep all existing required acknowledgments and voluntary response choices.

## Do's and Don'ts

- Do make finding a role and continuing an application the obvious next action.
- Do preserve saved values, server validation, privacy separation and PDF formatting through visual changes.
- Do use shared controls and tokens across every applicant section.
- Don't hide overflow or shrink legal text to make a screenshot fit.
- Don't represent browser-local drafts as server-confirmed storage.
- Don't redesign the admin console or legal packet incidentally during a public-site visual refresh.
