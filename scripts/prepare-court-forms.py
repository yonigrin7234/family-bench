"""Reproduce the app's AcroForm copies from byte-pinned, untouched official blanks.

Requires pypdfium2 + pypdf (available in the Codex bundled Python runtime).
No downloads, user documents, signatures, or filled values are processed here.
"""
from pathlib import Path
import hashlib
import json
import tempfile

import pypdfium2 as pdfium
import pypdfium2.raw as raw
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "assets" / "forms"
SOURCES = [
    {"id": "FL-300", "revision": "2025-07-01", "original": "originals/fl-300.2025-07-01.pdf", "template": "fl-300.acroform.pdf", "sourceUrl": "https://courts.ca.gov/system/files?file=2025-07%2Ffl300.pdf", "informationUrl": "https://selfhelp.courts.ca.gov/jcc-form/FL-300", "sha256": "1213b5a991672c67f906c56339dc755ed33e6c088cbf8644d75f95fd57985452", "pages": 4},
    {"id": "MC-031", "revision": "2005-07-01", "original": "originals/mc-031.2005-07-01.pdf", "template": "mc-031.acroform.pdf", "sourceUrl": "https://www.courts.ca.gov/documents/mc031.pdf", "resolvedUrl": "https://courts.ca.gov/sites/default/files/courts/default/2024-11/mc031.pdf", "informationUrl": "https://selfhelp.courts.ca.gov/jcc-form/MC-031", "sha256": "defc9108f6baa4c2ca444c1571d737d841af78289bef337f874f51e595191075", "pages": 1},
]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def strip_active_actions(writer):
    # XFA would otherwise take precedence over the filled AcroForm in Adobe.
    form = writer.root_object["/AcroForm"].get_object()
    form.pop("/XFA", None)
    form.pop("/CO", None)
    writer.root_object.pop("/Perms", None)  # Adobe Reader usage-rights signature, not a user signature.
    writer.root_object.pop("/OpenAction", None)
    seen = set()

    def visit(obj):
        obj = obj.get_object() if hasattr(obj, "get_object") else obj
        if id(obj) in seen:
            return
        seen.add(id(obj))
        if isinstance(obj, dict):
            obj.pop("/AA", None)
            obj.pop("/JavaScript", None)
            action = obj.get("/A")
            if action and action.get_object().get("/S") == "/JavaScript":
                obj.pop("/A", None)
            for item in list(obj.values()):
                visit(item)
        elif isinstance(obj, list):
            for item in obj:
                visit(item)

    visit(writer.root_object)


def raster_hashes(path):
    with pdfium.PdfDocument(path) as doc:
        doc.init_forms()
        return [sha(doc[i].render(scale=1.5, draw_annots=True).to_pil().tobytes()) for i in range(len(doc))]


def main():
    manifest = []
    for source in SOURCES:
        original = DEST / source["original"]
        assert sha(original.read_bytes()) == source["sha256"], f"Official source bytes changed: {original}"
        with tempfile.TemporaryDirectory(prefix="family-bench-form-") as scratch:
            intermediate = Path(scratch) / "unencrypted.pdf"
            with pdfium.PdfDocument(original) as pdf:
                pdf.save(intermediate, flags=raw.FPDF_REMOVE_SECURITY)
            reader = PdfReader(intermediate)
            writer = PdfWriter()
            writer.clone_document_from_reader(reader)
            strip_active_actions(writer)
            target = DEST / source["template"]
            writer.write(target)
        reopened = PdfReader(target)
        assert len(reopened.pages) == source["pages"]
        assert reopened.get_fields(), "Canonical AcroForm field tree must survive"
        before, after = raster_hashes(original), raster_hashes(target)
        assert before == after, f"Blank page rendering changed: {source['id']}"
        manifest.append({**source, "checkedAt": "2026-09-05", "templateSha256": sha(target.read_bytes()), "renderComparison": "All original and derived blank pages have identical PDFium 1.5x RGBA pixel hashes", "pagePixelHashes": after})
        print(source["id"], "pages", source["pages"], "blank render equality verified")
    (DEST / "manifest.json").write_text(json.dumps({"format": "family-bench-court-templates-v1", "derivation": "Original government downloads are untouched. Working copies retain the official page artwork and editable AcroForm field tree; permission encryption, XFA, Adobe Reader usage rights and active JavaScript actions are removed. No user or judicial signature is created. Reproduce with scripts/prepare-court-forms.py.", "forms": manifest}, indent=2) + "\n")


if __name__ == "__main__":
    main()
