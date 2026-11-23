# PDF response font fallback

Arial remains the primary font for entered PDF responses. The bundled Noto Sans Regular is used only for a response field containing a character unavailable in the installed Arial (for example, an okina missing from older Microsoft Core Fonts Arial). The entire affected field uses Noto Sans so combining characters remain together. Continuation text retains the same selected font. Original form artwork is unchanged. Neither font is exposed as a public website asset.

Noto Sans is unmodified and distributed under the accompanying SIL Open Font License 1.1.

- Official source repository: https://github.com/notofonts/noto-fonts
- Pinned revision: `ffebf8c1ee449e544955a7e813c54f9b73848eac`
- Font source: `hinted/ttf/NotoSans/NotoSans-Regular.ttf`
- Font SHA-256: `b85c38ecea8a7cfb39c24e395a4007474fa5a4fc864f6ee33309eb4948d232d5`
- License source: `LICENSE`
- License SHA-256: `0dab92d0544f7b233403f14b84a663bdbfa746982eda629e7f4f9ffe1b036feb`

Unsupported characters still cause an explicit error; they are never silently removed or transliterated. No proprietary desktop fonts are redistributed.
