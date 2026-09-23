const { uid, nowISO, num, int } = require("../lib/ids");
const { scopeFor } = require("../auth/scope");
const { requireRole } = require("../auth/middleware");
const { audit } = require("../lib/audit");

async function nextHouseholdCode(db, ward) {
  const prefix = `DHM-${(ward.code || ward.id).toUpperCase()}`;
  const rows = await db.all("SELECT code FROM households WHERE ward_id = ?", [ward.id]);
  let max = 0;
  rows.forEach((h) => {
    const m = /(\d+)$/.exec(h.code || "");
    if (m) max = Math.max(max, +m[1]);
  });
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

module.exports = function householdRoutes(db, { auth }) {
  const r = require("express").Router();

  r.get("/households", auth, async (req, res) => {
    const sc = await scopeFor(db, req.user);
    const params = [...sc.params];
    let sql = `SELECT h.*, w.name_hi AS ward_hi, w.name_en AS ward_en, w.block_id
               FROM households h LEFT JOIN wards w ON w.id = h.ward_id WHERE ${sc.sql.replace(/ward_id/g, "h.ward_id")}`;
    if (req.query.ward_id) { sql += " AND h.ward_id = ?"; params.push(req.query.ward_id); }
    if (req.query.q) {
      sql += " AND (LOWER(h.head_name) LIKE ? OR h.code LIKE ? OR h.phone LIKE ? OR h.house_no LIKE ?)";
      const q = `%${String(req.query.q).toLowerCase()}%`;
      params.push(q, q, q, q);
    }
    sql += " ORDER BY h.house_no, h.head_name LIMIT 2000";
    res.json(await db.all(sql, params));
  });

  r.get("/households/by-code/:code", auth, async (req, res) => {
    const h = await db.get("SELECT * FROM households WHERE code = ?", [req.params.code]);
    if (!h) return res.status(404).json({ error: "not_found" });
    res.json(h);
  });

  r.post("/households", auth, async (req, res) => {
    const b = req.body || {};
    if (!b.head_name || !b.ward_id) return res.status(400).json({ error: "head_name_and_ward_required" });
    const ward = await db.get("SELECT * FROM wards WHERE id = ?", [b.ward_id]);
    if (!ward) return res.status(400).json({ error: "bad_ward" });
    const id = b.id || uid();
    const code = b.code || await nextHouseholdCode(db, ward);
    await db.upsert("households", {
      id, code, head_name: b.head_name, phone: b.phone || null, ward_id: b.ward_id,
      house_no: b.house_no || null, category: b.category || "household",
      fee_slab: num(b.fee_slab) || 0, family_size: int(b.family_size, null),
      lat: num(b.lat), lng: num(b.lng),
      toilet: b.toilet ? 1 : 0, soak_pit: b.soak_pit ? 1 : 0, compost_pit: b.compost_pit ? 1 : 0,
      active: b.active === 0 ? 0 : 1, created_by: req.user.id, created_at: nowISO(), updated_at: nowISO(),
    }, "id");
    await audit(db, req.user.id, "upsert", "households", id);
    res.json(await db.get("SELECT * FROM households WHERE id = ?", [id]));
  });

  r.delete("/households/:id", auth, requireRole("admin", "supervisor", "state_admin"), async (req, res) => {
    await db.run("UPDATE households SET active = 0, updated_at = ? WHERE id = ?", [nowISO(), req.params.id]);
    await audit(db, req.user.id, "delete", "households", req.params.id);
    res.json({ ok: true });
  });

  return r;
};
