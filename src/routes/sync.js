const SYNCABLE = require("../db/syncable");
const { uid, nowISO } = require("../lib/ids");

module.exports = function syncRoutes(db, { auth }) {
  const r = require("express").Router();
  r.post("/sync", auth, async (req, res) => {
    const payload = req.body || {};
    const result = {};
    const errors = [];
    for (const [table, cols] of Object.entries(SYNCABLE)) {
      const rows = Array.isArray(payload[table]) ? payload[table] : [];
      let n = 0;
      for (const raw of rows) {
        try {
          const rec = {};
          for (const c of cols) if (raw[c] !== undefined) rec[c] = raw[c];
          if (!rec.id) rec.id = uid();
          if (cols.includes("created_at") && rec.created_at == null) rec.created_at = nowISO();
          if (table === "honorarium") {
            const amt = Number(rec.amount_per_person) || 0;
            const people = Number(rec.people) || 0;
            const months = Number(rec.months) || 0;
            rec.total = amt * people * months;
          }
          if (table === "ihhl" && rec.status) {
            const existing = await db.get("SELECT status FROM ihhl WHERE id = ?", [rec.id]);
            const ORDER = ["approved", "under_construction", "completed", "geotagged", "incentive_paid"];
            if (existing && ORDER.indexOf(rec.status) < ORDER.indexOf(existing.status)) {
              throw new Error("status_must_move_forward");
            }
          }
          if (table === "monitoring_visits") {
            if (rec.target_type && !["school", "anganwadi"].includes(rec.target_type)) {
              throw new Error("invalid_target_type");
            }
            if (rec.target_type && rec.target_id) {
              const tname = rec.target_type === "anganwadi" ? "anganwadis" : "schools";
              const hit = await db.get(`SELECT id FROM ${tname} WHERE id = ?`, [rec.target_id]);
              if (!hit) throw new Error("target_not_found");
            }
          }
          if (table === "hotspots" && rec.workflow) {
            const existing = await db.get("SELECT workflow FROM hotspots WHERE id = ?", [rec.id]);
            const FLOW = ["identified", "reported", "cleaning", "verified"];
            if (existing && FLOW.indexOf(rec.workflow) < FLOW.indexOf(existing.workflow)) {
              throw new Error("workflow_must_move_forward");
            }
          }
          for (const k of ["segregated", "toilet", "soak_pit", "compost_pit", "active", "accumulates", "shed_available", "dtd_happening", "segregation_happens", "kit_available", "paid"]) {
            if (rec[k] !== undefined) rec[k] = rec[k] ? 1 : 0;
          }
          await db.upsert(table, rec, "id");
          n++;
        } catch (e) {
          errors.push({ table, id: raw && raw.id, message: e.message });
        }
      }
      result[table] = n;
    }
    res.json({ ok: errors.length === 0, accepted: result, errors, server_time: nowISO() });
  });
  return r;
};
