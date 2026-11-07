# Kit List Generator

An interactive packing-list builder for Beaver, Cub and Scout leaders. Answer a handful of questions about the trip, weather and activities, then download:

- a branded, print-ready **PDF** with checkboxes and quantities; and
- a **CSV** with `Item, Category, Quantity, Notes` columns for Online Scout Manager or any checklist tool.

Everything runs in the browser. No young people's data is collected, and answers are only saved to `localStorage` on the leader's device.

## How it works

| File | Purpose |
| --- | --- |
| `index.html` | The wizard, results view and page copy |
| `assets/css/kit-list.css` | Tool-specific layout, document preview and print styles |
| `assets/js/kit-list.js` | Wizard state, rendering, validation and downloads |
| `assets/js/kit-data.js` | Section/trip/activity options and the packing rules |
| `assets/js/kit-csv.js` | CSV escaping and download |
| `assets/js/kit-pdf.js` | jsPDF layout and brand styling |
| `assets/fonts/` | Nunito Sans Regular, Bold and Black (SIL Open Font License) |
| `assets/js/vendor/` | Vendored jsPDF UMD build and its MIT licence |

The packing rules are plain data and functions, so they can be tested without a browser:

```bash
npm run smoke:kit
```

That test checks the section night defaults, the paddling shower kit, winter additions, duplicate item IDs, CSV escaping and a real multi-page PDF.

## Adding or changing kit

Open `assets/js/kit-data.js`.

- **Sections, trip types, accommodation, weather** are exported arrays near the top.
- **Activities** are in `ACTIVITIES`; each activity can have `questions` for conditional follow-ups.
- **Packing rules** are in `buildKitList()`. Items are added with `addItem(groupId, { id, name, note, qty })`; duplicate IDs are merged so quantities and notes do not appear twice.
- **Tips** are assembled in `buildTips()`.

Use British spelling, sentence case for labels, and keep safety advice as a prompt for leaders rather than a guarantee.

## Brand notes

- Nunito Sans only: Regular for body, Bold for item names, Black for headings.
- Scouts Purple `#590fa9` is the site's UI purple; print/PDF purple matches the site token.
- The Scouts logotype is used as supplied, in a single colour, once per page/cover. It is never recreated as text.
- The PDF uses the same purple header, yellow accent and rounded surfaces as the rest of the toolbox.
- The site footer keeps the independent-resource disclaimer.

## Online Scout Manager CSV

OSM's public checklist tools do not include a documented bulk-import file. The CSV is deliberately simple so a leader can open it in Excel, Numbers or Google Sheets and paste the item column into OSM's checklist screen. Columns are:

```csv
Item,Category,Quantity,Notes
```

## Credits and licences

- PDF generation: [jsPDF](https://github.com/parallax/jsPDF), MIT. Licence text is in `assets/js/vendor/jspdf.LICENSE.txt`.
- Font: [Nunito Sans](https://fonts.google.com/specimen/Nunito+Sans), SIL Open Font License.
- Scouts and the Scouts fleur-de-lis are trademarks of The Scout Association. This tool is an independent resource and is not endorsed by The Scout Association.