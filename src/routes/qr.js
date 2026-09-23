const { pngBuffer, dataUrl } = require("../services/qr");
const { scopeFor } = require("../auth/scope");

module.exports = function qrRoutes(db, { auth }) {
  const r = require("express").Router();

  r.get("/qr/:code.png", async (req, res) => {
    const buf = await pngBuffer(req.params.code);
    res.type("png").send(buf);
  });

  r.get("/qr-sheet", auth, async (req, res) => {
    const sc = await scopeFor(db, req.user);
    let sql = `SELECT * FROM households WHERE active=1 AND ${sc.sql}`;
    const params = [...sc.params];
    if (req.query.ward_id) { sql += " AND ward_id = ?"; params.push(req.query.ward_id); }
    sql += " ORDER BY house_no, head_name LIMIT 400";
    const rows = await db.all(sql, params);
    const cards = [];
    for (const h of rows) {
      const src = await dataUrl(h.code);
      cards.push(`<div class="card"><img src="${src}"><div class="n">${h.head_name}</div><div class="c">${h.code}</div></div>`);
    }
    res.type("html").send(`<!doctype html><html><head><meta charset="utf-8"><title>QR sheet</title>
      <style>body{font-family:sans-serif}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
      .card{border:1px solid #ccc;padding:8px;text-align:center;break-inside:avoid} img{width:140px}.n{font-weight:700}.c{font-family:monospace}</style>
      </head><body><h2>QR stickers</h2><div class="grid">${cards.join("")}</div></body></html>`);
  });

  return r;
};
