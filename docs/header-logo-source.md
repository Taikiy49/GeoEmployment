# Header artwork and geometry

The careers header uses the exact original anniversary artwork and responsive geometry from the official GeoWeb website at test.geolabs.net. The November 22, 2026 request explicitly approved this match; other page content and application workflows are unchanged.

- Source project: GeoWeb, `src/components/Shell.tsx` and `src/index.css`.
- Source asset: `public/brand/geolabs-50th-anniversary.png` (906×300).
- Portal copy: `public/geolabs-50th-anniversary.png`.
- SHA-256: `7aaf83c66d6d551cdd05a85a02623d06b272c2e277cee6bb8baa7277313df0b1`.
- Original artwork provenance: GeoWeb `docs/refinement-asset-sources.json`, Geolabs' `Geolabs_50_Logo_Long_Trans.png`.

The source is copied without cropping, recoloring or resampling. The existing smaller logo remains available for other consumers. DESIGN.md documents header sizing; `scripts/test-header-alignment.mjs` checks both public routes, responsive boundaries, keyboard focus, menu stability and local screenshots. Tests use only local previews and do not submit applications or send emails.
