#!/usr/bin/env python3
"""Prepare versioned public document backgrounds from Lola's rendered originals.

This is an offline, maintainer-only build step, not a production dependency.
Render the source DOCX files with the bundled document renderer first. Run with
PyMuPDF available to the bundled Python runtime, for example via a task-local
PYTHONPATH. Source PDFs are never modified. Public output includes only blank
forms, readable text and content hashes, never original filesystem paths.

The application background intentionally includes only the final agreements
from page two. Its preceding skills/reference sections remain in the existing
online application. Coordinates use PDF points with a top-left origin.
"""

import argparse
import hashlib
import json
import re
from pathlib import Path

import pymupdf as pdf


VERSION = "lola-v1"
SOURCES = {
    "eeo-survey": ("EEO Voluntary Self-Id/EEO Voluntary Self-Id.pdf", 1),
    "veteran-status": (
        "ProtectedVeteran Self Id Applicant VEVRAA/ProtectedVeteran Self Id Applicant VEVRAA.pdf",
        2,
    ),
    "alcohol-drug-agreement": ("drug/Agreement of Applicant.pdf", 1),
    "application-agreements": (
        "EmployApplication rev 2025.04.02/EmployApplication rev 2025.04.02.pdf",
        2,
    ),
}
PRIVATE_PATH = re.compile(r"\(?/(?:Users|home)/[^\n]*?\.docx\)?")
APPLICATION_CLIP = pdf.Rect(0, 248, 612, 754)
APPLICATION_DESTINATION = pdf.Rect(0, 36, 612, 542)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def scrub_source(document):
    """Remove local path glyphs, not merely cover them with white paint."""
    removed_count = 0
    for page in document:
        # These are document backgrounds. Unexpected active fields need an
        # explicit migration instead of silently preserving or flattening them.
        if list(page.widgets() or []):
            raise ValueError("Source unexpectedly contains interactive fields")
        for match in PRIVATE_PATH.finditer(page.get_text()):
            boxes = page.search_for(match.group())
            if not boxes:
                raise ValueError("A private footer path could not be located")
            for box in boxes:
                page.add_redact_annot(box, fill=False)
                removed_count += 1
        if list(page.annots() or []):
            page.apply_redactions(images=0, graphics=0, text=0)
        if PRIVATE_PATH.search(page.get_text()):
            raise ValueError("A private footer path remains after redaction")
    return removed_count


def scrub_metadata(document):
    document.set_metadata({})
    document.del_xml_metadata()
    for name in document.embfile_names():
        document.embfile_del(name)
    for page in document:
        for link in page.get_links():
            page.delete_link(link)
        for annotation in list(page.annots() or []):
            page.delete_annot(annotation)


def paragraph_text(value):
    # The original visual PDF remains authoritative. Join visual line wraps
    # within each original text block for screen readers and read-aloud tools.
    return " ".join(value.replace("\uf0b7", "\u2022").split())


def text_asset(document_id, document):
    return {
        "id": document_id,
        "version": VERSION,
        "pages": [
            {
                "page": index + 1,
                "width": page.rect.width,
                "height": page.rect.height,
                "text": "\n\n".join(
                    paragraph_text(block[4])
                    for block in page.get_text("blocks", sort=True)
                    if block[6] == 0 and paragraph_text(block[4])
                ),
                "paragraphs": [
                    paragraph_text(block[4])
                    for block in page.get_text("blocks", sort=True)
                    if block[6] == 0 and paragraph_text(block[4])
                ],
            }
            for index, page in enumerate(document)
        ],
    }


def prepare(source_root, output_root):
    output_root.mkdir(parents=True, exist_ok=True)
    manifest = {"version": VERSION, "coordinateOrigin": "top-left", "documents": []}
    for document_id, (relative_source, expected_pages) in SOURCES.items():
        source_path = source_root / relative_source
        source_hash = digest(source_path)
        source = pdf.open(source_path)
        if len(source) != expected_pages:
            raise ValueError(f"Unexpected source page count for {document_id}")
        if any(page.rect != pdf.Rect(0, 0, 612, 792) for page in source):
            raise ValueError(f"Unexpected source page dimensions for {document_id}")
        source_revision = re.findall(r"[Rr]evised\s+\d+/\d+/\d+", "\n".join(page.get_text() for page in source))
        redacted_paths = scrub_source(source)
        crop = None
        if document_id == "application-agreements":
            source.select([1])
            page = source[0]
            heading = page.search_for("MEDICAL INFORMATION")
            if len(heading) != 1 or not APPLICATION_CLIP.contains(heading[0]):
                raise ValueError("Application agreement heading moved; inspect the source")
            # show_pdf_page's visual clip alone keeps hidden source text. Truly
            # redact everything outside the approved excerpt before embedding.
            page.add_redact_annot(pdf.Rect(0, 0, 612, APPLICATION_CLIP.y0), fill=False)
            page.add_redact_annot(pdf.Rect(0, APPLICATION_CLIP.y1, 612, 792), fill=False)
            page.apply_redactions(images=2, graphics=2, text=0)
            output = pdf.open()
            destination = output.new_page(width=612, height=792)
            destination.show_pdf_page(APPLICATION_DESTINATION, source, 0, clip=APPLICATION_CLIP)
            crop = {
                "sourcePage": 2,
                "sourceRectangle": list(APPLICATION_CLIP),
                "destinationRectangle": list(APPLICATION_DESTINATION),
                "scale": 1,
                "offsetX": 0,
                "offsetY": -212,
            }
        else:
            output = source
        scrub_metadata(output)
        target = output_root / f"{document_id}.pdf"
        output.save(target, garbage=4, clean=True, deflate=True, no_new_id=True)
        output.close()
        if output is not source:
            source.close()
        verified = pdf.open(target)
        all_text = "\n".join(page.get_text() for page in verified)
        if re.search(r"/(?:Users|home)/|file://", all_text):
            raise ValueError(f"Private path leaked in {document_id}")
        if any(value for key, value in verified.metadata.items() if key not in {"format", "encryption"}):
            raise ValueError(f"Unexpected document metadata in {document_id}")
        if any(revision not in all_text for revision in source_revision):
            raise ValueError(f"Source revision was lost for {document_id}")
        if document_id == "application-agreements":
            for prohibited in ("SKILLS", "REFERENCES", "Social Security", "GENERAL INFORMATION"):
                if prohibited in all_text:
                    raise ValueError(f"Hidden out-of-scope text remains: {prohibited}")
        readable_path = output_root / f"{document_id}.json"
        readable_path.write_text(json.dumps(text_asset(document_id, verified), indent=2, ensure_ascii=False) + "\n", encoding="utf8")
        manifest["documents"].append({
            "id": document_id,
            "sourceFilename": source_path.name,
            "sourceSha256": source_hash,
            "pdf": target.name,
            "pdfSha256": digest(target),
            "readableText": readable_path.name,
            "readableTextSha256": digest(readable_path),
            "pageCount": len(verified),
            "pages": [{"width": page.rect.width, "height": page.rect.height} for page in verified],
            "redactedFilesystemPaths": redacted_paths,
            **({"excerpt": crop} if crop else {}),
        })
        verified.close()
        print(f"Prepared {document_id}: {manifest['documents'][-1]['pageCount']} page(s)")
    (output_root / "provenance.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", type=Path, default=Path("tmp/original-forms"))
    parser.add_argument("--output-root", type=Path, default=Path("public/forms") / VERSION)
    arguments = parser.parse_args()
    prepare(arguments.source_root, arguments.output_root)
