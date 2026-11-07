# RadarTrust USA — Website Design Plan

## Protected baseline
- Branch: `last-version` (snapshot of `main` before redesign)
- Development branch: `design-redesign-2026`
- Do not modify `last-version`.
- Do not merge or publish changes until visual and functional QA passes.

## Design direction
Create an original RadarTrust visual system rather than copying a vendor's site. Preserve the existing radar/teal identity, books, projects, certificates, responsive portrait, and visitor counter behavior.

## Refero research
- Linear: https://styles.refero.design/style/90ce5883-bb24-4466-93f7-801cd617b0d1 — precise grid, typography, subtle borders.
- Framer: https://styles.refero.design/style/242db326-a6f3-482a-b12e-5e7f8af94981 — project gallery and restrained microinteractions.
- Further candidates: Vercel, Raycast, Anthropic; verify exact references before extracting tokens.

## Work plan
1. Inventory existing HTML/CSS/JS and assets; identify protected features and dependencies.
2. Document baseline screenshots and interactive behavior at desktop and mobile sizes.
3. Establish coherent design tokens and responsive layout.
4. Implement page-by-page in the development branch only.
5. Test navigation, search/filter, books, projects, cards, accessibility, mobile rendering, and visitor counter.
6. Review visual diffs and performance, then open a PR for approval.

## Rollback
Restore `main` from the `last-version` branch if the approved redesign fails. Do not delete the backup branch.
