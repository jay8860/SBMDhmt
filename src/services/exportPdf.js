function htmlTable(entity, rows) {
  const cols = rows.length ? Object.keys(rows[0]) : ["no_data"];
  const head = cols.map((c) => `<th>${c.replace(/_/g, " ")}</th>`).join("");
  const body = rows.map((r) => `<tr>${cols.map((c) => `<td>${String(r[c] ?? "").replace(/</g, "&lt;")}</td>`).join("")}</tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${entity}</title>
  <style>body{font-family:sans-serif;padding:16px} table{border-collapse:collapse;width:100%;font-size:12px}
  th,td{border:1px solid #ccc;padding:6px;text-align:left} th{background:#15803d;color:#fff}
  @media print { button { display:none } }</style></head>
  <body><h2>${entity}</h2><p>${rows.length} rows</p>
  <button onclick="window.print()">Print / Save PDF</button>
  <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
  <script>window.onload=()=>setTimeout(()=>window.print(),400)</script></body></html>`;
}

module.exports = { htmlTable };
