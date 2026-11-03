# Scout Tools

A growing toolbox of free, practical tools for Beaver, Cub and Scout leaders, published as a static site on GitHub Pages.

**Currently in the box:** the [Games Finder](games/) — a searchable library of 50+ games with full rules, safety notes and leader tips.

> This is an independent, volunteer-made resource. It is not an official Scouts publication and is not endorsed by The Scout Association. Scouts and the Scouts fleur-de-lis are trademarks of The Scout Association.

## Repository layout

```
index.html             Toolbox home page (lists every tool)
404.html               Site-wide not found page
tools.json             The tool manifest — the home page reads this
assets/                Shared theme and brand kit
  css/base.css         Design tokens, header, footer, hero, buttons, forms
  css/home.css         Home page and tool cards
  js/home.js           Home page behaviour (renders tools.json)
  img/                 Scouts logos, favicon, icon sprite, fleur
games/                 The Games Finder tool (see games/README.md)
scripts/               Shared dev tooling
  dev-server.mjs       Zero-dependency preview server (npm run serve)
  check-assets.mjs     Verifies every local link (npm run check)
.github/workflows/     Pages deploy, data validation, game issue import
```

Each tool is a self-contained folder with its own pages, CSS, JavaScript, data and tests. The shared `assets/` folder keeps every tool on-brand.

## Local development

The tools load JSON with `fetch`, so they need a small web server. Opening the HTML files directly will not work.

```bash
npm install     # jsdom, used by the games smoke test
npm run serve   # then open http://localhost:8080
```

| Command | What it does |
| --- | --- |
| `npm run serve` | Serves the whole toolbox at <http://localhost:8080> |
| `npm run check` | Checks every local link and asset reference in the repo |
| `npm run validate` | Validates `games/data/games.json` against the shared schema |
| `npm run smoke` | Runs the Games Finder smoke test in jsdom |
| `npm run add -- my-game.json` | Adds a game from the command line |

## Adding a new tool

The toolbox is designed to grow. A new tool needs a folder, a manifest entry and a card icon — the home page does the rest.

**1. Create the tool folder**

```text
mytool/
  index.html                 The tool's main page
  assets/
    css/mytool.css           Tool-specific styles
    js/mytool.js             Tool behaviour
  README.md                  Optional: how the tool works
```

**2. Use the shared theme**

Link the shared design system first, then your own stylesheet:

```html
<link rel="stylesheet" href="../assets/css/base.css">
<link rel="stylesheet" href="assets/css/mytool.css">
```

`base.css` gives you the Scouts palette, fonts, header, footer, hero, buttons, form controls and utilities. Copy the header and footer markup from `index.html` (or a tool page) and adjust the links, so every tool looks and behaves the same.

**3. Add it to the manifest**

Open `tools.json` and add an entry:

```json
{
  "id": "mytool",
  "title": "My Tool",
  "href": "mytool/",
  "status": "ready",
  "icon": "compass",
  "color": "teal",
  "kicker": "Planning",
  "tagline": "One-line description for the card.",
  "description": "A sentence or two about what the tool does.",
  "tags": ["Beavers", "Cubs", "Scouts"]
}
```

- `status` can be `ready`, `beta` or `planned`. Planned tools render as a "coming soon" card with no link.
- `icon` is any symbol from `assets/img/icons.svg`.
- `color` is one of the shared cover colours: `purple`, `teal`, `blue`, `green`, `orange`, `pink`, `navy`, `yellow`, `red`, `mint`.

The home page picks it up automatically — no other changes needed.

**4. Check your links**

```bash
npm run check
```

This verifies every `href`, `src` and CSS `url(...)` in the repo, including icon sprite references.

**5. Optional: events and dates**

If the tool has repeating dates or events, consider a small JSON data file next to its page (like `games/data/games.json`) so non-developers can edit content without touching HTML.

## The Games Finder

The Games Finder lives in [`games/`](games/) and has its own documentation: the data schema, validation rules, the add-a-game form, the command-line tools and the GitHub issue import workflow are all in [`games/README.md`](games/README.md).

## Deploying

1. Push the repository to GitHub.
2. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The `Deploy to GitHub Pages` workflow publishes the site on every push to `main`.

The `.nojekyll` file stops GitHub Pages from running Jekyll, which keeps every asset path simple. If you use a custom domain, set `githubRepo` in `games/assets/js/config.js` so the add-a-game form can build GitHub issue links.

## Releases

Tag releases with `git tag v1.1.0 && git push --tags`, then create a GitHub release from the tag. The workflow picks up the change and redeploys automatically.

## Safety and content

Tools are contributed by leaders and edited for clarity. Safety notes are a starting point and are not a substitute for your own risk assessment, safeguarding procedures or the guidance of your section.

## Credits

- Layout and visual style are inspired by the Scouts activity finder and use the supplied Scouts brand assets.
- Scouts and the Scouts fleur-de-lis are trademarks of The Scout Association.
- This project is independent and not endorsed by The Scout Association.
