// Flat Item/Category/Quantity/Notes CSV export for spreadsheets and OSM checklists.

import { csvRows, slugify } from "./kit-data.js";

function escapeCell(value) {
  const text = String(value == null ? "" : value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsv(list) {
  const rows = csvRows(list);
  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

export function csvFilename(list) {
  return `${slugify(list.title)}-kit-list.csv`;
}

export function downloadCsv(list) {
  const csv = `\uFEFF${buildCsv(list)}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = csvFilename(list);
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before revoking the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
