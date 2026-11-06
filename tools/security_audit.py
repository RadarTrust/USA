#!/usr/bin/env python3
"""Read-only security guardrails for the public RadarTrust site.

Not a substitute for CodeQL, browser testing, or the separate Worker audit.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGES = [ROOT / "index.html", ROOT / "about.html", ROOT / "contact.html"]
PAGES += sorted((ROOT / "skills").glob("*.html"))
SUFFIXES = {".html", ".js", ".json", ".css", ".py"}
PATTERNS = {
    "GitHub token": re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9_]{24,}|github_pat_[A-Za-z0-9_]{20,})"),
    "AWS access key": re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    "private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "Stripe live key": re.compile(r"\bsk_live_[A-Za-z0-9]{16,}"),
}
errors = []

for page in PAGES:
    if not page.is_file():
        errors.append(f"Missing HTML entry point: {page.relative_to(ROOT)}")
        continue
    source = page.read_text(encoding="utf-8-sig")
    if not re.search(r'<meta\s+http-equiv=["\']Content-Security-Policy["\']', source, re.I):
        errors.append(f"Missing CSP meta policy: {page.relative_to(ROOT)}")
    if re.search(r"<script\b[^>]*\bsrc=['\"]http://", source, re.I):
        errors.append(f"Plain-HTTP script: {page.relative_to(ROOT)}")

for path in ROOT.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in SUFFIXES:
        continue
    rel = path.relative_to(ROOT).as_posix()
    if rel.startswith("assets/vendor/") or rel == "tools/security_audit.py":
        continue
    source = path.read_text(encoding="utf-8-sig")
    for label, pattern in PATTERNS.items():
        if pattern.search(source):
            errors.append(f"Potential {label} in {rel}; inspect privately and rotate if real")
    if "proxy.cors.dev" in source:
        errors.append(f"Unapproved third-party CORS relay in {rel}")
    if path.suffix.lower() == ".html" and re.search(r"javascript\s*:", source, re.I):
        errors.append(f"javascript: URL in HTML: {rel}")

if errors:
    for problem in errors:
        print("FAIL:", problem)
    sys.exit(1)
print(f"PASS: baseline security checks across {len(PAGES)} entry pages")
print("HTTP response headers and Cloudflare Worker require separate host-side review.")
