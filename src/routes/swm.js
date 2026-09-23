const { uid, nowISO, num, int } = require("../lib/ids");
const { scopedList, upsertHandler } = require("../lib/crud");
const SYNCABLE = require("../db/syncable");
const { audit } = require("../lib/audit");

module.exports = function swmRoutes(db, { auth }) {
  const r = require("express").Router();

  r.get("/swm/:wardId", auth, async (req, res) => {
    const row = await db.get("SELECT * FROM swm_gp WHERE ward_id = ?", [req.params.wardId]);
    const sales = await db.all("SELECT * FROM waste_sales WHERE ward_id = ? ORDER BY sale_date DESC", [req.params.wardId]);
    const pwmu = await db.all("SELECT * FROM pwmu_shipments WHERE ward_id = ? ORDER BY ship_date DESC", [req.params.wardId]);
    const hon = await db.all("SELECT * FROM honorarium WHERE ward_id = ? ORDER BY period DESC", [req.params.wardId]);
    const cats = await db.all("SELECT * FROM waste_category_totals WHERE ward_id = ? ORDER BY period DESC", [req.params.wardId]);
    res.json({ swm: row || null, sales, pwmu, honorarium: hon, categories: cats });
  });

  r.put("/swm/:wardId", auth, async (req, res) => {
    const b = req.body || {};
    const existing = await db.get("SELECT * FROM swm_gp WHERE ward_id = ?", [req.params.wardId]);
    const rec = {
      id: existing ? existing.id : uid("swm_"),
      ward_id: req.params.wardId,
      shed_available: b.shed_available ? 1 : 0,
      shed_usage: b.shed_usage || null,
      dtd_happening: b.dtd_happening ? 1 : 0,
      dtd_reason: b.dtd_reason || null,
      dtd_frequency: b.dtd_frequency || null,
      dtd_days_per_week: int(b.dtd_days_per_week, null),
      segregation_happens: b.segregation_happens ? 1 : 0,
      segregation_reason: b.segregation_reason || null,
      segregation_location: b.segregation_location || null,
      kit_available: b.kit_available ? 1 : 0,
      kit_status: b.kit_status || null,
      updated_at: nowISO(),
    };
    await db.upsert("swm_gp", rec, "id");
    await audit(db, req.user.id, "update", "swm_gp", rec.id);
    res.json(rec);
  });

  r.get("/waste-sales", auth, scopedList(db, "waste_sales"));
  r.post("/waste-sales", auth, upsertHandler(db, "waste_sales", SYNCABLE.waste_sales, {
    defaults: (req, rec) => ({ created_by: rec.created_by || req.user.id }),
  }));
  r.get("/pwmu", auth, scopedList(db, "pwmu_shipments"));
  r.post("/pwmu", auth, upsertHandler(db, "pwmu_shipments", SYNCABLE.pwmu_shipments, {
    defaults: (req, rec) => ({ created_by: rec.created_by || req.user.id, unit: rec.unit || "kg" }),
  }));
  r.get("/honorarium", auth, scopedList(db, "honorarium"));
  r.post("/honorarium", auth, async (req, res) => {
    const b = req.body || {};
    const people = int(b.people);
    const months = int(b.months);
    const amount = num(b.amount_per_person) || 0;
    const rec = {
      id: b.id || uid("hon_"), ward_id: b.ward_id, paid: b.paid ? 1 : 0, reason: b.reason || null,
      amount_per_person: amount, people, months, total: amount * people * months,
      period: b.period || null, notes: b.notes || null, updated_at: nowISO(),
    };
    await db.upsert("honorarium", rec, "id");
    await audit(db, req.user.id, "upsert", "honorarium", rec.id);
    res.json(rec);
  });
  r.get("/waste-categories", auth, scopedList(db, "waste_category_totals"));
  r.post("/waste-categories", auth, async (req, res) => {
    const b = req.body || {};
    if (!b.id && b.ward_id && b.period) {
      const existing = await db.get("SELECT * FROM waste_category_totals WHERE ward_id = ? AND period = ?", [b.ward_id, b.period]);
      if (existing) req.body.id = existing.id;
    }
    return upsertHandler(db, "waste_category_totals", SYNCABLE.waste_category_totals)(req, res);
  });
  return r;
};
