# Original document editor

## Direction contract

THESIS: Applicants read Lola's actual paper forms and enter their own answers in their original locations. Employment and education remain in the existing application.

OWN-WORLD: Inherit DESIGN.md's slate, yellow, Montserrat and DM Sans controls. The original PDF typography and geometry remain authoritative within the paper surface.

STORY: Choose a document, read it, move between highlighted fields, and explicitly acknowledge or sign. Optional self-identification remains skippable and clearable. Existing draft saves and review links remain the owners of progress.

FIRST VIEWPORT: Compact document navigation above the original paper page; Next field is the primary document action. Desktop and phones use the same PDF editor. Phones pan within the document, and Next field brings the focused input into view. The original text remains available to screen readers and read-aloud without a second visible view.

FORM: Extend the established application surface; no new visual identity or concept seed. PDF coordinates are shared by browser overlays and server output, avoiding two independent mappings.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Data and output

Signature inputs allow typing before acknowledgment. Typing never checks consent automatically: the existing client/server submission validation and completed-PDF consent gate still require explicit acknowledgment. The user requested no duplicate signature explanation, acknowledgment shortcut, or blank-PDF link beneath the editor; the actual acknowledgment checkbox remains above the document.

The document editor is controlled by Application's existing formData. It never generates a signature or infers a protected response. Native date inputs retain the existing platform-owned calendar, without duplicate app-owned Today buttons. Shared Button controls own actions; DocumentEditor owns the original-paper overlay variant and explicit consent checkboxes. Paper rendering retains accessible labels and the hidden original-document transcript.

Completed PDFs are static submission snapshots, not cryptographically signed documents. The original templates are retained. Historical submissions are not regenerated. The main application continues to include its existing policy summary and other answers; the separate original application-agreements PDF supplies the paper-format signed copy. Disability is not included.

Arial remains the primary response font. Typed signature fields use bundled Allura in the editor and completed original PDFs; the complete font is embedded to preserve contextual script glyphs. Unsupported signature characters use the existing Unicode-safe response font without changing the name. Older server versions of Arial lack some Hawaiian characters, so an affected response field uses bundled, openly licensed Noto Sans rather than changing or omitting the applicant's characters. This also applies to continuation text; original form artwork is never re-typeset. See `server/assets/fonts/README.md` and `public/fonts/README.md` for provenance and licenses.

## Source attachment verification — November 22, 2026

The four Word attachments were downloaded again from Lola's November 20, 2025 **FW: Application Packet** email. All four matched the source documents used for these templates byte for byte. The disability attachment was downloaded for reference only and is not included in the applicant flow or output.

| Original attachment | SHA-256 |
| --- | --- |
| Agreement of Applicant.docx | `03ad844125524f8935824ed2e732c42fbff67348152220ad243bf91d5ee50234` |
| EEO Voluntary Self-Id.docx | `bdad8c2aa24400552febd90b29ec7c33b38251c8f10a2242bbd8639f1a9433f7` |
| EmployApplication rev 2025.04.02.docx | `b7f4f88d645e994e073e58402c17a4179f55e0a6ace3a5471bf1ec309f7d8026` |
| ProtectedVeteran Self Id Applicant VEVRAA.docx | `b8fadad9b33352175ee0c5d75736fb812aa01cf1b7074d7e835578a869da3607` |

The requested scope was explicitly confirmed: keep the current work, education and skills screens and use only the original application's final agreement sections. That attachment is therefore an original-scale excerpt, not the entire two-page paper application. EEO, veteran and alcohol/drug attachments retain their complete original pages. Template preparation removes private filesystem footer paths and PDF metadata; it does not rewrite policy text or restyle the document body.

## Finish review

The scoped original-document editor received an independent Impeccable finish review with disposition `ship` on November 22, 2026. No material visual fixes remained. This verdict covers the supplied editor screenshots and inspected UI implementation; it is not a separate certification of PDF output or real assistive-technology behavior.

The historical evidence was `tmp/document-editor-review/1440-drug-original.png`, `1440-drug-readable.png`, `390-drug-readable.png` and `390-drug-original.png`, with the corresponding `-overview.png` captures used to inspect navigation and the document top. These are viewport/state captures, not full-page exports. On November 23, 2026, the user requested removing the view switch and duplicate Today buttons. Future visual review should capture the single original-document view at desktop and phone sizes, including field focus and document navigation. The earlier readable-view screenshots describe the prior implementation only.

The documenter check confirmed that `src/index.css`, `tailwind.config.js`, shared Button/FormField controls and the document editor stylesheet remain consistent with DESIGN.md and UX-CONTRACT.md. No design-system rewrite or sidecar regeneration was needed. The original PDF artwork remains the visual authority inside the paper surface; no generated raster assets were introduced.

## Local verification — November 22, 2026

- Typecheck, lint, production build and strict project audit passed.
- Ten browser workflow suites passed, plus desktop/mobile brand checks. Document editing, accessibility and submission checks also passed against the built production preview, not only the development server.
- Server integration passed 100 requests, including invalid responses rejected before storage or delivery.
- Original-form mapping, optional blanks, explicit consent, Hawaiian diacritics, static output and long-answer continuation checks passed; completed pages were visually inspected.
- Main PDF layout passed with actual Arial and bundled LibreOffice. The real main-plus-four-originals pipeline passed with mocked mail, including saved/attached byte identity and a maximum-size résumé below the Graph payload limit.
- All mail was intercepted; no production deployment or real delivery occurred in this verification. Browser checks do not replace testing on physical assistive devices. Unsupported PDF font glyphs fail explicitly rather than being silently omitted.

### Production-server regression gate

`npm run test:document-server` runs the built document editor against the actual Node server with isolated data and blocked delivery, in addition to the Vite preview tests. It verifies PDF and module-worker MIME types and all desktop/mobile document controls. This prevents the preview server from hiding a production-only document-loading failure. Font tests also force a limited primary font on every platform, so newer desktop Arial cannot conceal older production Arial's Unicode coverage gaps.
