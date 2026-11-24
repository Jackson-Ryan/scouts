# Uniform & Badge Placement Guide

An interactive UK Scouts uniform customiser and printable A4 PDF generator for Squirrels, Beavers, Cubs, Scouts, Explorers, Scout Network and Adult Volunteers.

Everything runs locally in the browser. Customisations and uploaded badge images stay in `localStorage` on your device and can be exported/imported as `.json` files to share across your Scout Group.

## Features

- **All official April 2024 UK Scouts layouts (17 variants)**: Squirrels, Beavers, Cubs (Land & Sea), Scouts (Land Shirt, Sea Jumper, Sea Shirt & Air Shirt), Explorers (Land/Sea/Air), Scout Network (Land/Sea/Air) and Adults (Land/Sea/Air).
- **Nation rules**: England, Scotland (Scotland Badge), Wales (both shoulder Wales Badges), Northern Ireland (Ulster + County + District layout & official footnote), or All UK.
- **Neckerchief / Scarf designer**: 11 patterns (plain, single/double/triple border, piped, halved, halved with border, diagonal stripes, tartan, quartered, contrast point), 24 UK Scout colour swatches plus custom hex pickers, woggle colour, and scarf-vs-sleeve Group Badge placement.
- **Dynamic name tape stack**: Customise your main Group/Unit/Network Name Tape and add unlimited extra custom tapes above or below it — lower sleeve badges automatically reflow downward to avoid overlap.
- **Show, hide & edit any official badge**: Rename badges (e.g. your District or County name), change shapes/colours/icons/monograms, upload your own badge image artwork, change cluster counts (Challenge Awards, Activity Badges, Joining In Awards), or toggle visibility with one-click presets (*Official default*, *New starter essentials*, *Show all*, *Hide all*).
- **Unlimited custom badges**: Drop in templates (District Exclusive Badge, Camp/Event Badge, Group Anniversary Badge, Custom District Crest) or blank custom badges, upload artwork, and drag them anywhere directly onto the uniform diagram.
- **Exports**: Branded print-ready **A4 PDF** (with crisp vector callout labels and an optional page-two sewing & placement key), high-resolution **PNG**, scalable **SVG**, browser **Print**, and **JSON** config save/load.

## File layout

| File | Purpose |
| --- | --- |
| `index.html` | Studio workspace, controls shell and page copy |
| `assets/css/uniform-guide.css` | Studio layout, swatches, interactive SVG styling, dark mode and print styles |
| `assets/js/uniform-data.js` | Official uniform definitions, necker options, templates and state normalisation |
| `assets/js/uniform-layout.js` | Dynamic sleeve tape stacking, NI placement rules and collision-free callout engine |
| `assets/js/uniform-svg.js` | Self-contained SVG renderer for garments, patterned neckers, curved tapes and badges |
| `assets/js/uniform-pdf.js` | Branded A4 PDF exporter (reuses vendored jsPDF & Nunito Sans from `kit-list/assets/`) |
| `assets/js/uniform-app.js` | Interactive studio UI, drag-and-drop canvas, image uploader and exports |
| `scripts/smoke-test.mjs` | Automated Node smoke test (`npm run smoke:uniform`) |

## Testing

```bash
npm run smoke:uniform
npm run check
```

## Credits and disclaimer

- PDF generation uses vendored [jsPDF](https://github.com/parallax/jsPDF) (MIT) and [Nunito Sans](https://fonts.google.com/specimen/Nunito+Sans) (SIL OFL) shared with `kit-list/`.
- Scouts and the Scouts fleur-de-lis are trademarks of The Scout Association. This is an independent, volunteer-made resource and is not endorsed by The Scout Association.
