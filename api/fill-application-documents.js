import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PDFDocument, PDFName, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { APPLICATION_DOCUMENTS } from '../shared/application-documents.js';

const INK = rgb(0, 0, 0);
const MIN_TEXT_SIZE = 8;
const DEFAULT_TEXT_SIZE = 10;

// Keep the entered response separate from the form artwork. These are the same
// data keys used by application drafts, review, validation and stored records.
export function getApplicationDocumentValues(application) {
  const data = { ...(application.applicationData || {}) };
  const eeo = application.eeoData || {};
  for (const [source, target] of [['gender', 'eeoGender'], ['race', 'eeoRace'], ['veteranStatus', 'veteranStatus']]) {
    if (Object.hasOwn(eeo, source)) data[target] = eeo[source];
  }
  return data;
}

async function loadArialBytes() {
  const locations = process.env.PDF_FONT_DIR
    ? [join(process.env.PDF_FONT_DIR, 'Arial.TTF')]
    : [
      '/usr/local/share/fonts/geolabs-arial/Arial.TTF',
      ...(process.platform === 'darwin' ? ['/System/Library/Fonts/Supplemental/Arial.ttf'] : []),
    ];
  for (const location of locations) {
    try { return await readFile(location); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  throw new Error('Arial is required to fill the application forms. Configure PDF_FONT_DIR with Arial.TTF.');
}

function assertRectangle(document, rectangle, label) {
  const { page, x, y, width, height } = rectangle;
  const pdfPage = document.getPageIndices().includes(page) ? document.getPage(page) : null;
  if (!pdfPage || ![x, y, width, height].every(Number.isFinite)
      || x < 0 || y < 0 || width <= 0 || height <= 0
      || x + width > pdfPage.getWidth() || y + height > pdfPage.getHeight()) {
    throw new Error(`Invalid document field rectangle: ${label}.`);
  }
  return pdfPage;
}

const responseText = value => value === undefined || value === null ? ''
  : String(value).replace(/\r\n?/g, '\n').replace(/\t/g, '    ');

function wrapText(text, font, size, width) {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    if (!paragraph) { lines.push(''); continue; }
    let line = '';
    // Retain words and line breaks; split a single over-wide token by Unicode
    // code point rather than dropping its tail or splitting surrogate pairs.
    for (const token of paragraph.match(/\S+\s*|\s+/gu) || []) {
      if (font.widthOfTextAtSize(line + token, size) <= width) { line += token; continue; }
      if (line.trim()) { lines.push(line.trimEnd()); line = ''; }
      for (const character of Array.from(token.trimStart())) {
        if (line && font.widthOfTextAtSize(line + character, size) > width) {
          lines.push(line.trimEnd()); line = '';
        }
        line += character;
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

function drawLines(page, lines, font, size, rectangle) {
  page.drawText(lines.join('\n'), {
    x: rectangle.x + 1,
    y: page.getHeight() - rectangle.y - size - 1,
    size, font, lineHeight: size * 1.2, color: INK,
  });
}

function drawResponse(document, field, value, font, continuation) {
  const text = responseText(value);
  if (!text.trim() || !field.rect) return;
  const page = assertRectangle(document, field.rect, field.label);
  const width = field.rect.width - 2;
  const height = field.rect.height - 2;
  for (let size = DEFAULT_TEXT_SIZE; size >= MIN_TEXT_SIZE; size -= 0.25) {
    const lines = wrapText(text, font, size, width);
    if (lines.length * size * 1.2 <= height
        && lines.every(line => font.widthOfTextAtSize(line, size) <= width)) {
      drawLines(page, lines, font, size, field.rect);
      return;
    }
  }
  // The signed original remains unmodified except its response area. Never
  // silently clip a name or response to force it into the paper form's space.
  const marker = 'See continuation';
  if (font.widthOfTextAtSize(marker, MIN_TEXT_SIZE) <= width && MIN_TEXT_SIZE * 1.2 <= height) {
    drawLines(page, [marker], font, MIN_TEXT_SIZE, field.rect);
  }
  continuation.push({ label: field.label, text, font });
}

function drawCheck(document, rectangle, label) {
  if (!rectangle) return;
  const page = assertRectangle(document, rectangle, label);
  const inset = Math.min(2, rectangle.width / 5, rectangle.height / 5);
  const left = rectangle.x + inset;
  const right = rectangle.x + rectangle.width - inset;
  const bottom = page.getHeight() - rectangle.y - rectangle.height + inset;
  const top = page.getHeight() - rectangle.y - inset;
  page.drawLine({ start: { x: left, y: bottom }, end: { x: right, y: top }, thickness: 1, color: INK });
  page.drawLine({ start: { x: left, y: top }, end: { x: right, y: bottom }, thickness: 1, color: INK });
}

function appendContinuation(document, definition, continuation, font) {
  if (!continuation.length) return;
  let page;
  let cursor;
  const newPage = () => {
    page = document.addPage([612, 792]);
    page.drawText('Additional responses', { x: 42, y: 750, size: 13, font, color: INK });
    const titleLines = wrapText(definition.label, font, 10, 528);
    page.drawText(titleLines.join('\n'), { x: 42, y: 730, size: 10, font, lineHeight: 12, color: INK });
    cursor = 730 - titleLines.length * 12 - 20;
  };
  newPage();
  for (const entry of continuation) {
    const labels = wrapText(entry.label, font, 10, 528);
    if (cursor - (labels.length + 2) * 13 < 48) newPage();
    page.drawText(labels.join('\n'), { x: 42, y: cursor, size: 10, font, lineHeight: 13, color: INK });
    cursor -= labels.length * 13 + 5;
    for (const line of wrapText(entry.text, entry.font, 10, 528)) {
      if (cursor < 48) newPage();
      if (line) page.drawText(line, { x: 42, y: cursor, size: 10, font: entry.font, color: INK });
      cursor -= 13;
    }
    cursor -= 16;
  }
}

/** Produce completed static PDFs; the editable responses remain in the draft/record. */
export async function buildApplicationDocumentPdfs(application, safeApplicantName, {
  definitions = APPLICATION_DOCUMENTS,
  readTemplate = definition => readFile(new URL(`../public${definition.template}`, import.meta.url)),
  readFont = loadArialBytes,
  readFallbackFont = () => readFile(new URL('../server/assets/fonts/NotoSans-Regular.ttf', import.meta.url)),
} = {}) {
  const values = getApplicationDocumentValues(application);
  const fontBytes = await readFont();
  let fallbackBytes;
  const results = [];
  // Sequential processing keeps the small production host's memory bounded.
  for (const definition of definitions) {
    const document = await PDFDocument.load(await readTemplate(definition));
    document.registerFontkit(fontkit);
    const font = await document.embedFont(fontBytes, { subset: true });
    const supportedCharacters = new Set(font.getCharacterSet());
    let fallbackFont;
    let fallbackCharacters;
    const supports = (characters, text) => Array.from(text).every(character => character === '\n' || characters.has(character.codePointAt(0)));
    const responseFont = async (text, label) => {
      if (supports(supportedCharacters, text)) return font;
      // Older server Arial lacks some Hawaiian characters. Use a licensed,
      // bundled Unicode font only for affected response fields, retaining the
      // exact input (including combining marks) and a consistent field face.
      // The original page artwork is never re-typeset or substituted.
      if (!fallbackFont) {
        fallbackBytes ||= await readFallbackFont();
        fallbackFont = await document.embedFont(fallbackBytes, { subset: true });
        fallbackCharacters = new Set(fallbackFont.getCharacterSet());
      }
      if (!supports(fallbackCharacters, text)) {
        throw new Error(`The configured PDF fonts cannot represent a character in ${label}. No application text was omitted.`);
      }
      return fallbackFont;
    };
    const continuation = [];
    for (const field of definition.fields) {
      if (field.requires && values[field.requires] !== true) continue;
      const value = values[field.key];
      if (field.type === 'radio') {
        const selected = field.options?.find(option => option.value === value);
        if (selected) drawCheck(document, selected.rect, field.label);
      } else if (field.type === 'checkbox') {
        if (value === true) {
          if (field.trueText) drawResponse(document, field, field.trueText, font, continuation);
          else drawCheck(document, field.rect, field.label);
        }
      } else if (field.rect) {
        const text = responseText(value);
        drawResponse(document, field, text, await responseFont(text, field.label), continuation);
      }
    }
    appendContinuation(document, definition, continuation, font);
    // Originals are blank templates, not previously signed files. Keep final
    // response marks in page content so attachments print consistently.
    const form = document.getForm();
    if (form.getFields().length) form.flatten();
    document.catalog.delete(PDFName.of('AcroForm'));
    document.setTitle(definition.label);
    document.setAuthor('Geolabs, Inc.');
    document.setSubject('Completed employment application document');
    document.setCreator('Geolabs, Inc. Employment Portal');
    results.push({
      key: definition.key,
      label: definition.label,
      filename: `${safeApplicantName}-${definition.filename}`,
      content: Buffer.from(await document.save()),
      type: 'application/pdf',
      restricted: Boolean(definition.restricted),
    });
  }
  return results;
}
