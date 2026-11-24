# Scout Tools

Free, practical tools for Beaver, Cub and Scout leaders, published as a static site on GitHub Pages.

**Currently included:**

- [Games Finder](games/) — a searchable library of 50 games with rules, equipment, safety notes, adaptations and themed twists.
- [Kit List Generator](kit-list/) — a packing list builder with a printable A4 PDF and a CSV for Online Scout Manager.
- [Uniform & Badge Placement Guide](uniform-guide/) — an interactive uniform diagram customiser with neckerchief designer, custom name tapes, custom badges and printable A4 PDF export.

> This is an independent, volunteer-made resource. It is not an official Scouts publication and is not endorsed by The Scout Association. Scouts and the Scouts fleur-de-lis are trademarks of The Scout Association.

## Repository layout

```text
index.html             Home page (renders tools.json)
about.html             About Scout Tools, safety notes and credits
404.html               Site-wide not found page (self-contained)
tools.json             Tool manifest read by the home page
assets/                Shared theme, scripts and brand assets
  css/base.css         Design tokens, header, footer, hero, buttons, custom controls
  css/home.css         Home page and tool cards
  css/about.css        About page layout and prose styles
  js/site-config.js    Public site settings (repo, allowed admins, OAuth client id, worker URL)
  js/auth.js           GitHub OAuth 2.0 + PKCE client, repo API & in-app submissions client
  js/site.js           Shared header/footer renderer, tools loader, icons and menu
  js/controls.js       Shared custom themed selects, date pickers, steppers and dialogs
  js/home.js           Home page behaviour (renders tools.json)
  js/about.js          Site chrome bootstrap for about.html
  img/                 Scouts logos, favicon, icon sprite (~200 icons), fleur
admin/                 Maintainer admin console (/admin/, GitHub SSO)
games/                 Games Finder tool (see games/README.md)
kit-list/              Kit List Generator tool (see kit-list/README.md)
uniform-guide/         Uniform & Badge Placement Guide (see uniform-guide/README.md)
worker/                Cloudflare Worker for GitHub SSO & in-app game submissions (see worker/README.md)
scripts/               Shared dev tooling
  dev-server.mjs       Zero-dependency preview server (npm run serve)
  check-assets.mjs     Verifies every local link and sprite icon (npm run check)
.github/workflows/     Pages deploy, data validation, game issue import
```

Each tool lives in its own folder with its own pages, styles, scripts, data and tests, while sharing the base styles and icon sprite from `assets/`.

## Local development

The pages load JSON with `fetch`, so serve the repo over HTTP rather than opening the HTML files directly.

```bash
npm install     # installs jsdom for the Games Finder smoke test
npm run serve   # opens on http://localhost:8080
```

| Command | What it does |
| --- | --- |
| `npm run serve` | Serves the site at <http://localhost:8080> |
| `npm run check` | Checks every local link, asset and SVG icon reference |
| `npm run validate` | Validates `games/data/games.json` against the schema |
| `npm run smoke` | Runs the Games Finder smoke test in jsdom |
| `npm run smoke:kit` | Runs the Kit List Generator smoke test (data, CSV and PDF) |
| `npm run smoke:uniform` | Runs the Uniform & Badge Guide smoke test (16 layouts, SVG and PDF) |
| `npm run add -- my-game.json` | Adds a game from the command line |

## Adding a new tool

1. Create a folder (for example `mytool/`) with `index.html`, `assets/css/`, and `assets/js/`.
2. Link `../assets/css/base.css` before your own stylesheet, include the two shared chrome placeholders in your page:
   ```html
   <header class="site-header" data-site-header data-root="../" data-active="mytool"></header>
   <footer class="site-footer" data-site-footer data-root="../"></footer>
   ```
   and call `initSite()` from `../assets/js/site.js`. That renders the header, footer and mobile menu automatically and upgrades every `.select`, `input[type="date"]`, `input[type="search"]` and `input[type="number"]` into the site's custom themed controls. Use `confirmDialog()` from `../assets/js/site.js` instead of `window.confirm()`, and `.cover--purple`..`.cover--mint` from `base.css` for brand cover art.
3. Add an entry to `tools.json` with `id`, `title`, `href`, `status` (`ready`, `beta` or `planned`), `icon` (any symbol in `assets/img/icons.svg`), `color`, `kicker`, `tagline`, `description` and `tags`. The home page, navbar and footer pick it up automatically.
4. Run `npm run check` to verify every link, asset path and icon reference.

## Tool documentation

- [Games Finder](games/README.md) — data schema, validation, in-app game submissions, CLI scripts and admin tools.
- [Kit List Generator](kit-list/README.md) — packing logic, PDF generation (vendored [jsPDF](https://github.com/parallax/jsPDF), MIT + Nunito Sans) and OSM CSV format.
- [Uniform & Badge Placement Guide](uniform-guide/README.md) — official UK Scouts layouts, neckerchief patterns, custom tapes/badges and PDF export.
- [Admin SSO & Submission Worker](worker/README.md) — setup guide for GitHub SSO on `/admin/` and account-free public game submissions on GitHub Pages.

## Deploying

1. Push the repository to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. The `Deploy to GitHub Pages` workflow publishes the site on pushes to `main`.

`.nojekyll` disables Jekyll processing so asset paths stay straightforward. If you fork the site onto a custom domain, update `githubRepo`, `allowedAdmins`, `githubClientId` and `apiBase` in `assets/js/site-config.js` (and `worker/wrangler.toml` if using the Worker).

## Safety and credits

- Safety notes and kit lists are a starting point and do not replace your own risk assessment, venue checks or safeguarding procedures.
- Visual styling takes inspiration from the Scouts activity finder and uses supplied Scouts brand assets.
- Scouts and the Scouts fleur-de-lis are trademarks of The Scout Association. This project is independent and not endorsed by The Scout Association.
