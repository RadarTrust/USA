#!/usr/bin/env python3
"""RadarTrust static site integrity check (Python 3.9+, stdlib only).

Validate the file structure, internal hyperlinks, skill routes and public
credential catalog. No API keys, network access or paid service required.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

EXPECTED_SKILLS = 36
HEX_ROUTE = re.compile(r"^#/s/[0-9a-f]{6}$")


class References(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[tuple[str, str]] = []
        self.skills: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = dict(attrs)
        if tag in ("a", "link", "script", "img", "iframe"):
            key = "href" if tag in ("a", "link") else "src"
            if a.get(key):
                self.links.append((key, a[key] or ""))
        if a.get("data-skill"):
            self.skills.append(a["data-skill"] or "")


def read_html(path: Path) -> References:
    parser = References()
    parser.feed(path.read_text(encoding="utf-8-sig"))
    parser.close()
    return parser


def skill_hash(name: str) -> str:
    """Mirror the public 32-bit FNV-1a router, six-character opaque slug."""
    value = 2166136261
    for char in name:
        value = ((value ^ ord(char)) * 16777619) & 0xFFFFFFFF
    return f"{value:08x}"[:6]


def audit(root: Path) -> tuple[list[str], dict[str, int]]:
    errors: list[str] = []
    report = {"html_documents": 0, "skill_nodes": 0, "skill_pages": 0,
              "core_credentials": 0, "archive_credentials": 0}
    index = root / "index.html"
    if not index.is_file():
        return ["Missing index.html"], report

    main = read_html(index)
    # Regression guard: the large works CTA must NEVER be inside the
    # clipped 16.667svh desktop hero floor (.hero-lower).
    html = index.read_text(encoding="utf-8-sig")
    hero_start = html.find('<section class="hero">')
    hero_end = html.find("</section>", hero_start) if hero_start >= 0 else -1
    feature_start = html.find('<section class="rt-works-feature"')
    about_start = html.find('<section id="about"')
    if not (0 <= hero_start < hero_end < feature_start < about_start):
        errors.append("Works CTA must be a standalone section AFTER the radar hero and BEFORE about")
    if html.count('class="rt-works-banner"') != 1:
        errors.append("Expected exactly one publications/project CTA")
    report["skill_nodes"] = len(main.skills)
    if len(main.skills) != EXPECTED_SKILLS:
        errors.append(f"Expected {EXPECTED_SKILLS} skill buttons; found {len(main.skills)}")

    hashes: set[str] = set()
    for skill in main.skills:
        slug = skill_hash(skill)
        if slug in hashes:
            errors.append(f"Duplicate skill route for {skill}: {slug}")
        hashes.add(slug)
        path = root / "skills" / (slug + ".html")
        if not path.is_file():
            errors.append(f"Missing skill profile: {skill} -> {path.relative_to(root)}")
        else:
            report["skill_pages"] += 1
            content = path.read_text(encoding="utf-8")
            if "Building trust" not in content or "through expertise Radar" not in content:
                errors.append(f"Missing matching RadarTrust identity: {skill}")
            if 'class="credentials"' not in content:
                errors.append(f"Missing credential section: {skill}")

    all_html = sorted(root.rglob("*.html"))
    report["html_documents"] = len(all_html)
    for page in all_html:
        parsed = read_html(page)
        for _, uri in parsed.links:
            parts = urlsplit(uri)
            if parts.scheme or parts.netloc or uri.startswith(("#", "//", "mailto:", "tel:", "data:")):
                continue
            ref = unquote(parts.path)
            if not ref or ref.startswith("/"):
                continue
            target = (page.parent / ref).resolve()
            try:
                target.relative_to(root.resolve())
            except ValueError:
                errors.append(f"Out-of-root reference: {page.relative_to(root)} -> {uri}")
                continue
            if not target.exists():
                errors.append(f"Broken local reference: {page.relative_to(root)} -> {uri}")

    # Online reading content: require complete page editions and no public PDF master.
    if not (root / "book-reader.html").is_file():
        errors.append("Missing online book reader")
    pdfs = [p.relative_to(root).as_posix() for p in root.rglob("*.pdf")]
    if pdfs:
        errors.append("Original downloadable PDFs found in public repository: " + ", ".join(pdfs[:10]))
    book_catalog = root / "books" / "catalog.json"
    if book_catalog.is_file():
        try:
            books = json.loads(book_catalog.read_text(encoding="utf-8-sig"))
            for book in books:
                reader_id = book.get("readerId")
                if not reader_id:
                    continue
                if reader_id != book.get("id") or not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}", reader_id):
                    errors.append("Invalid reader identifier: " + str(reader_id))
                    continue
                page_path = root / "books" / "readers" / reader_id / "pages.json"
                if not page_path.is_file():
                    errors.append("Missing reader pages for " + reader_id)
                    continue
                payload = json.loads(page_path.read_text(encoding="utf-8"))
                pages = payload.get("pages")
                if payload.get("id") != reader_id or not isinstance(pages, list) or not pages or len(pages) != payload.get("pageCount"):
                    errors.append("Invalid reader manifest for " + reader_id)
                elif not all(isinstance(x, dict) and x.get("n") == i and x.get("image") == f"page-{i:03d}.webp" and (page_path.parent / x["image"]).is_file() for i, x in enumerate(pages, 1)):
                    errors.append("Invalid page entries for " + reader_id)
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            errors.append("Invalid online reader JSON: " + str(exc))

    for name, key in (("credentials.json", "core_credentials"),
                      ("archive-certificates.json", "archive_credentials")):
        path = root / "data" / name
        if not path.is_file():
            errors.append(f"Missing credential catalog: {name}")
        else:
            try:
                records = json.loads(path.read_text(encoding="utf-8-sig"))
                if not isinstance(records, list):
                    raise ValueError("Catalog must be a list")
                report[key] = len(records)
            except (ValueError, json.JSONDecodeError) as exc:
                errors.append(f"Invalid credential catalog {name}: {exc}")
    return errors, report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1],
                        help="Repository root (defaults to parent of tools/)")
    parser.add_argument("--json", action="store_true", help="Machine-readable report")
    args = parser.parse_args()
    problems, report = audit(args.root.resolve())
    result = {"ok": not problems, "counts": report, "errors": problems}
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("RadarTrust repository integrity audit")
        for key, value in report.items():
            print(f"  {key.replace('_', ' ').title()}: {value}")
        if problems:
            print(f"\nFAILED: {len(problems)} issue(s)")
            for item in problems[:100]:
                print("  - " + item)
        else:
            print("\nPASS: all checked local paths and skill pages resolved.")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
