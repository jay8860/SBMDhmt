const { uid, nowISO, int, sumInts } = require("../lib/ids");
const { scopedList } = require("../lib/crud");
const { audit } = require("../lib/audit");
const { scopeFor } = require("../auth/scope");

function withTotals(b) {
  const fam_st = int(b.fam_st), fam_sc = int(b.fam_sc), fam_obc = int(b.fam_obc), fam_gen = int(b.fam_gen);
  const pop_st = int(b.pop_st), pop_sc = int(b.pop_sc), pop_obc = int(b.pop_obc), pop_gen = int(b.pop_gen);
  return {
    fam_st, fam_sc, fam_obc, fam_gen, fam_total: sumInts(fam_st, fam_sc, fam_obc, fam_gen),
    pop_st, pop_sc, pop_obc, pop_gen, pop_total: sumInts(pop_st, pop_sc, pop_obc, pop_gen),
  };
}

module.exports = function villageRoutes(db, { auth }) {
  const r = require("express").Router();
  r.get("/villages", auth, scopedList(db, "villages"));
  async function assertWardInScope(req, wardId) {
    const sc = await scopeFor(db, req.user);
    const row = await db.get(`SELECT id FROM wards WHERE id = ? AND ${sc.sql.replace(/ward_id/g, "id")}`, [wardId, ...sc.params]);
    return !!row;
  }

  r.post("/villages", auth, async (req, res) => {
    const b = req.body || {};
    if (!b.ward_id || !b.name_hi) return res.status(400).json({ error: "ward_and_name_required" });
    if (!(await assertWardInScope(req, b.ward_id))) return res.status(403).json({ error: "out_of_scope" });
    const id = b.id || uid("vil_");
    const rec = {
      id, ward_id: b.ward_id, name_hi: b.name_hi, name_en: b.name_en || b.name_hi, code: b.code || null,
      ...withTotals(b), updated_at: nowISO(),
    };
    await db.upsert("villages", rec, "id");
    await audit(db, req.user.id, "upsert", "villages", id);
    res.json(rec);
  });
  r.put("/villages/:id", auth, async (req, res) => {
    const existing = await db.get("SELECT * FROM villages WHERE id = ?", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "not_found" });
    if (!(await assertWardInScope(req, existing.ward_id))) return res.status(403).json({ error: "out_of_scope" });
    const b = { ...existing, ...req.body };
    const rec = {
      ...existing, ...b, ...withTotals(b), id: existing.id, updated_at: nowISO(),
    };
    await db.upsert("villages", rec, "id");
    await audit(db, req.user.id, "update", "villages", rec.id);
    res.json(rec);
  });
  return r;
};
