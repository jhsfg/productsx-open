# ProductsX Open — Open-Source B2B Marketplace Frontend

[![ProductsX.app](https://img.shields.io/badge/Live-ProductsX.app-ff2442?logo=googlechrome&logoColor=white)](https://productsx.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![No Build Tools](https://img.shields.io/badge/Build-None%20%E2%80%94%20Vanilla%20JS-success)](#quick-start)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**ProductsX Open** is the official open-source frontend of [**ProductsX.app**](https://productsx.app) — a free global **B2B marketplace** and **wholesale supplier directory**. Browse **product listings from verified manufacturers and suppliers worldwide**, search the catalog, and jump straight into the live platform to connect with factories directly.

> **Live site:** [https://productsx.app](https://productsx.app) · **Explore suppliers:** [https://productsx.app/explore](https://productsx.app/explore) · **Search:** [https://productsx.app/search](https://productsx.app/search)

This repository contains a **dependency-free HTML + CSS + JavaScript** implementation of the ProductsX product feed and supplier directory. It talks to the same **public REST API** that powers [ProductsX.app](https://productsx.app), so every page you render here shows real, live B2B data — products, prices, MOQ, manufacturers, and more.

---

## Table of Contents

- [Why ProductsX?](#why-productsx)
- [Features](#features)
- [Technical Highlights](#technical-highlights)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Public API Reference](#public-api-reference)
- [Deploy Your Own (GitHub Pages / Netlify / Vercel)](#deploy-your-own-github-pages--netlify--vercel)
- [SEO-Friendly by Design](#seo-friendly-by-design)
- [Contributing](#contributing)
- [License](#license)
- [Links](#links)

---

## Why ProductsX?

Sourcing products globally usually means walled-garden marketplaces. **ProductsX** takes the opposite approach: an **open index of B2B products and suppliers** that anyone can browse, search, and — with this open-source frontend — embed or remix anywhere.

- **Free to browse** — no account required to explore products, suppliers, tags, and communities
- **Verified manufacturers** — company profiles with location, founding year, size, and verified badges
- **Rich product specs** — price, MOQ, lead time, certifications, and multi-channel listings
- **Open API** — the same JSON endpoints this frontend uses are available to your project (see [Public API Reference](#public-api-reference))
- **No middlemen** — connect directly with suppliers on [ProductsX.app](https://productsx.app)

## Features

| Feature | Description |
| --- | --- |
| Product waterfall feed | Masonry-style grid via native **CSS multi-column**, infinite scroll via `IntersectionObserver` |
| Matrix table view | Dense spec table (title / supplier / price / MOQ / certs / lead time), switchable with the Feed view |
| Split detail panel | Google Images-style right side panel — browse the list while reading details |
| Supplier directory | Responsive card grid of verified manufacturers with country, size, and product counts |
| Live search suggest | Debounced `/api/search` dropdown with keyword highlighting and keyboard navigation |
| Public comments | Threaded comments rendered from the public comments API inside the detail panel |
| Dark / light theme | Respects `prefers-color-scheme`, remembers user choice in `localStorage` |
| Zero dependencies | No frameworks, no bundler, no build step — plain HTML/CSS/JS |
| Mobile-first responsive | 2-column compact waterfall on phones, adaptive columns on desktop, reduced table columns |
| SEO-ready markup | Semantic HTML, `JSON-LD` structured data (`WebSite` + `SearchAction`), Open Graph, canonical URLs |

## Technical Highlights

### 1. Google Images-Style Masonry Waterfall (CSS Multi-Column)

The product feed reproduces the dense, column-balanced layout of Google Images search — using **no JavaScript layout code**:

- **Native CSS columns** (`column-width` / `column-gap`) let the browser balance cards across columns. Column count adapts automatically to the viewport: 2 columns on phones (fixed `column-count`), then `column-width: 12rem` lets the browser decide up to 6+ columns on wide screens.
- **`break-inside: avoid`** keeps every card intact; images render at their natural aspect ratio (`width: 100%; height: auto`), so the staggered masonry rhythm comes from the content itself.
- **Fixed card width, adaptive column count** — the container decides how many `12rem` columns fit and distributes leftover space, so cards never stretch.
- Zero layout thrash: no JS measuring, no absolute positioning, no ResizeObserver loops.

```css
.feed-container { column-width: 12rem; column-gap: 12px; }
.product-card   { break-inside: avoid; margin-bottom: 12px; }
```

### 2. Non-Blocking Right Split Detail Panel

Clicking a card opens a **right-side split panel** (same interaction pattern as Google Images' side panel), not a modal:

- The product list stays **visible, scrollable, and clickable** — the overlay is transparent with `pointer-events: none`, so clicking another card instantly switches the panel content (no close-and-reopen flicker).
- The panel slides in with a `transform: translateX(100%) → 0` transition; on tablets/desktops the main column yields width (`padding-right`) with a synchronized transition, so the waterfall re-flows gracefully instead of being covered.
- The selected card gets a highlight ring (`.product-card.selected`) mirroring Google Images' selection state.
- **Image carousel** for multi-image products — a translateX sliding track with arrows and dot indicators (same pattern as the main site), plus touch-swipe support on mobile.
- Detail data (specs, certifications, tags, supplier) comes **from the card payload itself** — zero extra requests — while the threaded comment stream is fetched lazily from the public comments API.
- Escape key, close button, and switching cards all dismiss it; interaction on mobile (full-width panel) is touch-optimized.

### 3. IntersectionObserver Infinite Scroll

A 1px sentinel element after the feed triggers the next page fetch **600px before the viewport bottom** (`rootMargin: '600px 0px'`), so content is ready before the user reaches the edge. Falls back to a passive `scroll` listener on old browsers; a retry button appears on network failure. After 3 pages, a back-to-top button fades in.

### 4. Debounced Live Search Suggest

The header search queries `/api/search` with a 250ms debounce once 2+ characters are typed. Results render in an ARIA combobox dropdown (`role="listbox"`, `aria-activedescendant`) with:
- **Match highlighting** via `<mark>` (case-insensitive, XSS-safe escaping)
- **Full keyboard navigation** (↑/↓ to move, Enter to open, Esc to dismiss)
- Products and supplier sections, plus a footer deep-link to the full search page

### 5. Design System in Pure CSS

All visual decisions flow through `:root` custom properties — colors, rem-based spacing (`--sp-*`), type scale (`--fs-*`), radii, shadows, easing. Dark mode is a single `html.theme-dark` variable override; every component picks up the change automatically with a smooth transition.

### 6. XSS-Safe Rendering

All dynamic strings (titles, supplier names, specs, comments) pass through a single `esc()` helper before template interpolation. No `innerHTML` sink ever receives unescaped API data.

## Quick Start

No installation, no build, no dependencies. Just serve the folder statically:

```bash
# Option 1: Python
python -m http.server 8080

# Option 2: Node.js
npx serve .

# Option 3: PHP
php -S localhost:8080
```

Open <http://localhost:8080> in your browser. The pages immediately start pulling live data from the ProductsX public API.

## Project Structure

```text
productsx-open/
├── index.html          # Product feed (waterfall of B2B listings)
├── suppliers.html      # Supplier / manufacturer directory
├── css/
│   └── productsx.css   # Design system: CSS variables, waterfall, dark mode
├── js/
│   └── productsx.js    # API client, card templates, infinite scroll, theme
├── LICENSE             # MIT
└── README.md
```

## Public API Reference

All endpoints below are **public, read-only, and CORS-enabled**. Base URL: `https://productsx.app`

| Endpoint | Description | Key Parameters |
| --- | --- | --- |
| `GET /api/posts` | Paginated product feed | `page` (int), `q` (keyword), `tag` (tag slug), `community` (community slug), `supplier_guid` |
| `GET /api/companies` | Paginated supplier directory | `page` (int), `tag` (tag slug) |
| `GET /api/search` | Unified search (products + suppliers) | `q` (min 2 chars) |
| `GET /api/communities` | Community list | `parent_id`, `level` |
| `GET /api/tags` | Tag autocomplete | `q` (min 2 chars, prefix match, max 10) |

**Example — fetch the first page of products:**

```bash
curl "https://productsx.app/api/posts?page=1"
```

**Response shape:**

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "guid": "0_l4UOKxHcM",
        "title": "Stainless Steel Water Bottle 750ml",
        "mediaType": 1,
        "images": ["https://.../product.jpg"],
        "supplier_name": "ACME Manufacturing",
        "supplier_guid": "abc123",
        "specs": { "price": "$2.80", "moq": "500 pcs", "certs": "FDA, LFGB", "lead": "15 days" },
        "tags": ["drinkware", "bottle"],
        "like_count": 12
      }
    ],
    "page": 1,
    "has_more": true
  }
}
```

**Deep links** you can build from the API (great for SEO):

| Resource | URL Pattern | Example |
| --- | --- | --- |
| Product detail | `https://productsx.app/p/{guid}` | [/p/0_l4UOKxHcM](https://productsx.app/p/0_l4UOKxHcM) |
| Supplier profile | `https://productsx.app/supplier/{guid}` | [Supplier profiles](https://productsx.app/explore) |
| Tag page | `https://productsx.app/tag/{slug}` | [Browse by tag](https://productsx.app/explore) |
| Community feed | `https://productsx.app/c/{slug}` | [Communities](https://productsx.app/explore) |
| Search results | `https://productsx.app/search?q={query}` | [/search?q=bottle](https://productsx.app/search?q=bottle) |

## Deploy Your Own (GitHub Pages / Netlify / Vercel)

This is a static site — deploy anywhere in seconds:

1. **GitHub Pages** — Settings → Pages → deploy from branch (`main`, root). Done.
2. **Netlify / Vercel** — import the repo, no build command needed, publish root as-is.

Point your own domain at it, or keep it as a mirror. All product/supplier links lead back to [ProductsX.app](https://productsx.app), so your deployment always shows fresh data.

## SEO-Friendly by Design

This project doubles as a reference implementation for **SEO-optimized static frontends on top of a JSON API**:

- **Semantic HTML5** — `header`, `main`, `article`, `footer` landmarks with descriptive `aria-*` labels
- **JSON-LD structured data** — `WebSite` + `SearchAction` (enables sitelinks search box), `Organization`, `CollectionPage`
- **Canonical URLs** point to the live platform (`https://productsx.app`) to consolidate ranking signals
- **Open Graph / Twitter cards** for rich social previews
- **Human-readable URL patterns** for products, suppliers, and tags on the main site
- **Fast by default** — no framework runtime, lazy-loaded images, `IntersectionObserver` pagination, sitemap available at [https://productsx.app/sitemap_index.xml](https://productsx.app/sitemap_index.xml)
- **Crawlable without JS** — `<noscript>` fallback links to the server-rendered pages on ProductsX.app

## Contributing

Contributions are welcome! Bug reports, UI improvements, accessibility fixes, and new frontends (React/Vue/Svelte ports) are all appreciated. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## License

Released under the [MIT License](LICENSE). You are free to use, modify, and distribute this code — attribution appreciated but not required.

## Links

- **Live Platform:** [https://productsx.app](https://productsx.app)
- **Explore Suppliers:** [https://productsx.app/explore](https://productsx.app/explore)
- **Search Products:** [https://productsx.app/search](https://productsx.app/search)
- **About:** [https://productsx.app/about](https://productsx.app/about)
- **Sitemap:** [https://productsx.app/sitemap_index.xml](https://productsx.app/sitemap_index.xml)
- **Public API:** [https://productsx.app/api/posts](https://productsx.app/api/posts)

---

*ProductsX — Discover quality products, suppliers, and manufacturing partners worldwide.*
