---
version: alpha
name: Geolabs Careers
description: Restored pre-redesign careers and application interface.
colors:
  primary: "#A65F2A"
  ink: "#111923"
  surface: "#ffffff"
  background: "#f8fafc"
typography:
  body:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
rounded:
  DEFAULT: "12px"
spacing:
  section: "24px"
---
# Geolabs Careers Design System

## Overview

The user explicitly requested restoration of the interface from commit `ec5add9` on 2026-09-19. That commit, immediately before the visual redesign, is the visual reference. Do not reintroduce the fieldbook layout, split hero, left progress rail, condensed display fonts, or Source Sans typography without approval.

Audience: applicants for Geolabs roles in Hawaiʻi and California, and authorized HR staff. English-language recruitment; preserve diacritics and existing HR-approved wording. README.md and UX-CONTRACT.md document business and interaction context.

## Colors

Restore the original dark blue header, bronze accents, light application background, white cards and slate text. Existing semantic success/error colors remain. Do not alter administrative colors incidentally.

## Typography

Use the original `--font-inter` system stack in src/index.css and existing Tailwind type scale. Neither Barlow nor Source Sans is imported. PDF typography remains Arial and is independent of web fonts.

## Layout

Restore the full-width fieldwork-video hero with overlaid text, original careers cards/benefits, horizontal application progress, and rounded application container. The document owns scrolling. Keep responsive layouts from the reference commit.

## Elevation & Depth

Preserve original card shadows, borders, header treatment and background. The current request is a rollback, not a new visual direction.

## Shapes

Keep existing rounded cards and controls from the reference. Runtime classes remain canonical rather than introducing a second theme.

## Components

Runtime ownership is Model B: src/index.css, tailwind.config.js and the original shared component classes own values; this document records their intended use. FormField owns labels/selects/long text, StepShell owns incoming section focus/scroll, and Application owns draft/submission state.

Nonvisual fixes retained: immediate keyed task replacement without fading through blank frames, single navigation scroll owner, client-side home links, authentication isolation, modal inert background and focus containment, keyboard-operable file selection, and auto-growing long-answer fields. These do not authorize redesigning the old appearance.

Global scrollbar operability and focus visibility remain required. Native date/month inputs remain platform-owned; applicant select uses the existing Radix primitive. Read-aloud and reduced-motion support remain. Do not change required acknowledgments, voluntary choices, email routing or PDF layout for aesthetics.

## Do's and Don'ts

- Match `ec5add9` for visual choices.
- Preserve current features, data, privacy boundaries and tested reliability fixes.
- Keep the previous redesign recoverable in Git history and the pre-rollback stash.
- Do not reset repository history or restore old production data.
