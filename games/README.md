# Games Finder

The Games Finder is one tool in the [Scout Tools](../README.md) repo. It lives in this `games/` folder and can be developed, tested and used on its own.

A static, searchable games finder for Beaver, Cub and Scout leaders. It is inspired by the Scouts activity finder and is designed to be published for free on GitHub Pages.

- Filter games by section, length, theme and setting.
- Full detail pages with equipment, set-up, rules, safety notes and leader tips.
- **Variants** are separate games with different rules.
- **Themed twists** keep the same rules and change the story or props.
- A guided **Add a game** form with live preview, JSON download and GitHub issue submission.
- No build step, no database, no tracking.

> This is an independent resource. It is not an official Scouts publication and is not endorsed by The Scout Association. Scouts and the Scouts fleur-de-lis are trademarks of The Scout Association.

## Quick start

The site loads `data/games.json` with `fetch`, so it needs a small web server. Opening `index.html` directly from the file system will not work.

```bash
# from the repository root
npm run serve
# then open http://localhost:8080/games/
```

The dev server serves the whole repo, so the [toolbox home page](../index.html) is at `http://localhost:8080/` too.

The built-in server has no dependencies. Any static server works too, for example:

```bash
python -m http.server 8080
```

## Project structure

Everything in this folder belongs to the Games Finder:

```
index.html                 Games finder
game.html                  Game detail page
add.html                   Add a game form
about.html                 About, variants vs twists, safety and credits
404.html                   Not found page (the repo root serves the real one)
data/games.json            The whole games library
assets/css/                games, detail, forms, misc (theme comes from ../assets)
assets/js/
  config.js                Site name, repository, saved-games key
  core.js                  Shared data loading, filtering and rendering
  index.js                 Finder page behaviour
  game.js                  Detail page behaviour
  add.js                   Add form behaviour
  about.js                 Header/menu behaviour for static pages
assets/img/                Game icons sprite and callout fleur
scripts/
  game-schema.mjs          Shared validation rules
  validate-games.mjs       npm run validate (from the repo root)
  add-game.mjs             Add games from the command line
  import-issue.mjs         Used by the issue import workflow
  smoke-test.mjs           jsdom smoke test for every page (npm run smoke)
```

Shared theme and brand assets (design tokens, header/footer, logos, hub icons) live in the repo's top-level `assets/` folder so every tool looks the same. The repo root also holds `.github/workflows/`, `tools.json` and `scripts/dev-server.mjs`.

## Tests

A small smoke test runs every page in jsdom and checks the rendered output — filters, saving, pagination, detail sections, variants, form validation and JSON export. From the repo root:

```bash
npm install   # installs the jsdom dev dependency
npm run smoke
npm run validate
```

## Adding a game

### 1. Use the form (recommended)

Open `add.html` and fill in the fields. The live preview shows the game card as you type. When the game is ready you can:

- **Download game** — a single `<game-id>.json` file.
- **Download games.json** — the full library with your game appended.
- **Open GitHub issue** — if the site is connected to a repository, this fills in the issue body automatically.
- **Copy issue text** — for pasting into an issue by hand.

### 2. Add it on the command line

Run from the repository root (or use the same paths from inside `games/` without the `games/` prefix):

```bash
node games/scripts/add-game.mjs my-game.json
node games/scripts/add-game.mjs my-game.json --dry-run
npm run validate
```

The file can contain one game object or an array of games. The script checks the shared schema, refuses duplicate ids and base-game problems, and writes `games/data/games.json`.

### 3. Import from a GitHub issue

The **Import game submission** workflow looks for JSON between these markers:

```
<!-- GAME_SUBMISSION_START -->
```json
{ "id": "my-game", ... }
```
<!-- GAME_SUBMISSION_END -->
```

When someone opens an issue containing the markers, the workflow validates the game, appends it to `games/data/games.json`, commits the change, comments on the issue and closes it. Invalid submissions get a comment explaining what to fix. The workflow lives in the repo root at `.github/workflows/import-game-submission.yml`.

To enable it:

1. Push the repository to GitHub.
2. Create a label called `game-submission` (optional, but the issue form references it).
3. Make sure Actions have **Read and write permissions** (Settings → Actions → General → Workflow permissions).
4. Open an issue with the **Game submission** template, or use the button in `add.html`.

## Game data schema

Each entry in `data/games.json` has:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Lowercase, hyphenated, unique. |
| `title` | string | 3–80 characters. |
| `summary` | string | One or two sentences for the card. |
| `sections` | array | `beavers`, `cubs`, `scouts`. At least one. |
| `timeBand` | string | `quick`, `normal` or `long`. Drives the length filter. |
| `duration` | string | Shown to leaders, e.g. `10–20 mins`. |
| `minutes` | number | Used for “shortest first”. |
| `setting` | string | `indoors`, `outdoors` or `both`. |
| `players` | string | e.g. `Two teams`, `Whole section`. |
| `gameType` | string | e.g. `Active`, `Relay`, `Calm`. |
| `energy` | string | `low`, `medium`, `high`. |
| `noise` | string | `quiet`, `medium`, `loud`. |
| `mess` | string | `none`, `low`, `medium`. |
| `themes` | array | Theme tags. Can be empty. |
| `equipment` | array | One item per entry. |
| `setup` | array | One step per entry. |
| `steps` | array | One rule or step per entry. |
| `winning` | string | How a winner is decided. |
| `safety` | string | Safety notes. |
| `tips` | array | `{ "title": "...", "text": "..." }`. |
| `adaptations` | array | `{ "title": "...", "text": "..." }`. |
| `themedTwists` | array | `{ "theme": "...", "title": "...", "text": "..." }`. Same rules, new story. |
| `variantOf` | string or null | Id of the original game when the rules change. |
| `featured` | boolean | Featured games appear on the home page (three or four works best). |
| `art` | object | `{ "color": "purple", "icon": "dodgeball" }`. Valid values come from `assets/js/core.js`. |
| `added` | string | `YYYY-MM-DD`. |
| `author` | string | Name or `Community contributor`. |

Validation is shared by the browser form, the command-line tools and the GitHub workflows: `games/scripts/game-schema.mjs`.

## Customising

All paths below are inside `games/`:

- **Site name and repository** — `assets/js/config.js`. Set `githubRepo` to `owner/repo` if the automatic GitHub Pages detection does not fit. Leave it blank on `*.github.io` and the site works it out from the URL.
- **Saved games** — stored in `localStorage` under `savedKey`; no account is needed.
- **Colours and fonts** — the shared theme lives in the repo root at `assets/css/base.css` (the `:root` block). The palette follows the supplied Scouts CSS, so every tool matches.
- **Icons** — add a `<symbol id="...">` to `games/assets/img/icons.svg` and add it to `ICON_OPTIONS` in `assets/js/core.js` so it appears in the form.
- **Themes** — add to `THEMES` in `assets/js/core.js`; the filter, form and twist picker all read from it.

## Deploying

Deployment is handled for the whole toolbox by the repo root's `Deploy to GitHub Pages` workflow (see the [top-level README](../README.md#deploying)). The Games Finder is served from `/games/`, with the toolbox home page at `/`.

## Safety and content

Games are contributed by leaders and edited for clarity. The safety notes are a starting point and are not a substitute for your own risk assessment, safeguarding procedures or the guidance of your section. If a game needs a safer adaptation, please open an issue or submit a corrected version.

## Credits

- Layout and visual style are inspired by the Scouts activity finder and use the supplied Scouts brand assets.
- Scouts and the Scouts fleur-de-lis are trademarks of The Scout Association.
- This project is independent and not endorsed by The Scout Association.
