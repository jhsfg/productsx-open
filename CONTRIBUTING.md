# Contributing to ProductsX Open

Thanks for your interest in improving the open-source frontend of [ProductsX.app](https://productsx.app)!

## How to Contribute

1. **Fork** the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/my-improvement
   ```
2. **Keep it dependency-free.** This project intentionally uses vanilla HTML/CSS/JS — no frameworks, no bundlers, no npm. If a feature truly needs a library, discuss it in an issue first.
3. **Follow the existing code style:**
   - CSS: design tokens in `:root` variables (`--primary`, `--sp-*`, `--fs-*`, `--r-*`), rem units
   - JS: ES5-compatible syntax, IIFE encapsulation, XSS-safe rendering via `esc()`
4. **Test locally** before submitting:
   ```bash
   python -m http.server 8080
   ```
   Verify both `index.html` (product feed) and `suppliers.html` (directory) render live data, and check dark mode + mobile viewport.
5. **Commit** with a clear message and open a Pull Request.

## Good First Issues

- Accessibility improvements (keyboard navigation, focus states)
- New card layouts (list view, comparison view)
- i18n / multi-language support
- Performance (image lazy-loading strategies, prefetch hints)

## Code of Conduct

Be respectful and constructive. All interactions in this repository are covered by the standard open-source etiquette.

## Questions?

Open an issue or reach us via [https://productsx.app/about](https://productsx.app/about).
