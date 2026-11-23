---
version: alpha
name: Geolabs Careers
description: Official Geolabs slate and yellow identity applied to the established employment workflow.
colors:
  primary: "#2d3142"
  yellow: "#f4cd00"
  surface: "#ffffff"
  background: "#f3f4f5"
  muted: "#606676"
  line: "#d9dce2"
  focus: "#806000"
typography:
  display:
    fontFamily: "Montserrat, sans-serif"
  body:
    fontFamily: "DM Sans, sans-serif"
rounded:
  DEFAULT: "2px"
spacing:
  page-max: "1360px"
  section: "24px"
---
# Geolabs Careers Design System

## Overview

On November 20, 2026, the user approved adopting the official website's visual identity from test.geolabs.net and the GeoWeb codebase. This supersedes the September rollback's bronze/system-font rule, not its application layout or reliability requirements.

Reference: GeoWeb src/index.css and DESIGN.md; live computed styles confirmed Montserrat, DM Sans and #2d3142 on November 20. Preserve the careers video, approved copy, horizontal progress stages, tasks, validation, draft recovery and HR navigation. Do not reintroduce the rejected fieldbook layout, split hero, left progress rail or condensed typography.

Audience: applicants in Hawaiʻi and California and authorized HR staff. English recruitment; preserve diacritics, existing legal wording, permission boundaries and all document/email behavior. Public careers is a brand surface; application and HR screens are task-focused product surfaces.

## Colors

Use slate #2d3142, yellow #f4cd00, white, soft gray #f3f4f5, muted #606676 and separators #d9dce2. Primary controls use slate with white text; selected steps and HR navigation use yellow with slate text. Yellow is not body text on white. Dark-gold #806000 supplies visible focus on light surfaces; yellow supplies focus on slate.

Semantic validation/success/warning colors remain distinct and retain labels/icons. The original logo artwork is not recolored.

## Typography

Self-host Montserrat 500–800 for headings and DM Sans 400–700 for reading and controls, matching GeoWeb's font packages. Latin subsets include Hawaiian punctuation and normal English text; system fallbacks remain available. No remote font request.

Body: 17px desktop / 16px mobile, line-height 1.7. Form inputs: 16px, with 14px labels and 12px supporting hints. Form section headings: 20–24px. Marketing headings use GeoWeb's clamp(30px, 3.15vw, 46px) and hero clamp(40px, 4.6vw, 70px). Compact HR metadata retains its existing utility scale. PDF typography stays Arial.

## Layout

Keep the established application layout and natural document scrolling. Marketing container: 1360px with clamp(24px, 4.5vw, 72px) gutters; section spacing clamp(64px, 7vw, 104px), 60px on phones. Application keeps its readable 1152px inner maximum, with 32–40px internal panel padding on larger screens and 20px on phones. Do not copy marketing-sized whitespace into every form row.

Header matches the official GeoWeb masthead: flush-left anniversary artwork, no centered content gutter or bottom border, and a yellow logo panel overhanging the bar. Above 1150px, the bar is 78px and the panel is 260×90px (10px 18px padding); at 641–1150px the panel narrows to 235px. At 640px and below, the bar is 72px and the panel is 216×82px (10px 14px padding); at 360px and below the panel narrows to 198px. Reuse the official 906×300 artwork at public/geolabs-50th-anniversary.png. The 48px unboxed menu button appears at 1150px and below. Only the masthead is full bleed; application/content containers keep their existing gutters. No sticky form footer, new sidebar, or extra animation sequence.

## Elevation & Depth

Use white/soft-gray surfaces and quiet separators. Preserve useful panel boundaries in long forms. No warm gradient wash behind the application. Existing restrained dialog/card shadows remain where they communicate grouping or overlay depth.

## Shapes

GeoWeb's 2px control radius; application grouping panels use 6–8px as a deliberate product adaptation. Circular step numbers, status pills and media controls retain their semantic shapes. Primary application navigation targets are at least 52px high; step/task targets at least 44px.

## Components

Token ownership is Model B. src/index.css owns RGB channels --brand-ink, --brand-yellow, --brand-muted, --brand-soft, --brand-line and --brand-focus. tailwind.config.js adapts these to brand utilities and neutral palette roles. Legacy navy/bronze/cream aliases are compatibility adapters, not independent palettes. Body/display font variables feed shared elements and Tailwind font families; font-inter is a compatibility utility for DM Sans.

Header, AppFooter, FormField, FormSection, NavigationButtons and Stepper consume shared tokens. Radix Select remains the applicant dropdown owner; native date/month controls stay platform-owned. Admin native selectors and existing state colors remain. Scrollbars use #868b99/#f3f4f5 with muted/ink hover/active and forced-color fallback.

StepShell owns immediate focused task replacement without blank frames. Application owns validation, drafts and submission. No business behavior, policy text, PDF layout, signatures, authentication or email routing changes are authorized by this visual work.

## Do's and Don'ts

- Match the official website's identity, not its content or marketing information architecture.
- Keep all applicant/HR actions, focus recovery and reduced-motion behavior.
- Verify fonts, colors, contrast, mobile overflow, open selects, and draft/submission workflows.
- Do not deploy or send real applications/emails as part of visual testing.
- Do not replace authentic assets or invent company claims.
