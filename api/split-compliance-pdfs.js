import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const SECTION_DEFINITIONS = [
  {
    key: 'eeo-survey',
    label: 'EEO Voluntary Self-Identification Survey',
    marker: 'EEO Voluntary Self-Identification Survey',
    filenameSuffix: 'EEO-Survey',
    restricted: true,
  },
  {
    key: 'veteran-status',
    label: 'Protected Veteran Self-Identification',
    marker: 'Invitation to Self-Identify as a Protected Veteran',
    filenameSuffix: 'Veteran-Status',
    restricted: true,
  },
  {
    key: 'alcohol-drug-agreement',
    label: 'Alcohol & Drug Testing Agreement',
    marker: 'Alcohol & Drug Testing Program',
    filenameSuffix: 'Alcohol-Drug-Agreement',
    restricted: false,
  },
];

const normalizePageText = value => String(value || '')
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

async function extractPageTexts(pdfBuffer) {
  const task = getDocument({ data: new Uint8Array(pdfBuffer), useSystemFonts: true });
  const document = await task.promise;
  try {
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(normalizePageText(content.items.map(item => item.str || '').join(' ')));
    }
    return pages;
  } finally {
    await task.destroy();
  }
}

const findLastPage = (pages, marker) => {
  const normalizedMarker = normalizePageText(marker);
  let found = -1;
  pages.forEach((text, index) => {
    if (text.includes(normalizedMarker)) found = index;
  });
  return found;
};

async function copyPageRange(source, start, end, metadata) {
  if (start < 0 || end < start || end >= source.getPageCount()) {
    throw new Error(`Invalid PDF page range for ${metadata.label}.`);
  }
  const output = await PDFDocument.create();
  const indices = Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
  const pages = await output.copyPages(source, indices);
  pages.forEach(page => output.addPage(page));
  const footerFont = await output.embedFont(StandardFonts.Helvetica);
  const footerTextColor = rgb(71 / 255, 85 / 255, 105 / 255);
  pages.forEach((page, index) => {
    const { width } = page.getSize();
    // Mask the source packet footer before drawing the standalone form footer.
    page.drawRectangle({ x: 0, y: 0, width, height: 66, color: rgb(1, 1, 1) });
    page.drawLine({ start: { x: 54, y: 39 }, end: { x: width - 54, y: 39 }, thickness: 0.5, color: rgb(221 / 255, 227 / 255, 233 / 255) });
    const text = `Geolabs, Inc.  •  Confidential  •  Page ${index + 1} of ${pages.length}`;
    const textWidth = footerFont.widthOfTextAtSize(text, 7.5);
    page.drawText(text, { x: (width - textWidth) / 2, y: 19, size: 7.5, font: footerFont, color: footerTextColor });
  });
  output.setTitle(metadata.label);
  output.setAuthor('Geolabs, Inc.');
  output.setSubject('Confidential employment application compliance record');
  output.setCreator('Geolabs, Inc. Employment Portal');
  return Buffer.from(await output.save());
}

export async function splitCompliancePdfs(applicationPdf, safeApplicantName) {
  const [pageTexts, source] = await Promise.all([
    extractPageTexts(applicationPdf),
    PDFDocument.load(applicationPdf),
  ]);
  const starts = SECTION_DEFINITIONS.map(section => findLastPage(pageTexts, section.marker));
  if (starts.some(page => page < 0) || starts.some((page, index) => index > 0 && page <= starts[index - 1])) {
    throw new Error('Could not identify all compliance sections in the completed application PDF.');
  }

  return Promise.all(SECTION_DEFINITIONS.map(async (section, index) => ({
    key: section.key,
    label: section.label,
    filename: `${safeApplicantName}-Geolabs-${section.filenameSuffix}.pdf`,
    content: await copyPageRange(
      source,
      starts[index],
      index < starts.length - 1 ? starts[index + 1] - 1 : source.getPageCount() - 1,
      section,
    ),
    type: 'application/pdf',
    restricted: section.restricted,
  })));
}

export { extractPageTexts };
