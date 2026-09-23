const { scopedList, upsertHandler } = require("../lib/crud");
const SYNCABLE = require("../db/syncable");

module.exports = function cleanlinessRoutes(db, { auth }) {
  const r = require("express").Router();
  r.get("/cleanliness-cases", auth, scopedList(db, "cleanliness_cases"));
  r.post("/cleanliness-cases", auth, upsertHandler(db, "cleanliness_cases", SYNCABLE.cleanliness_cases, {
    defaults: (req, rec) => ({ uploaded_by: rec.uploaded_by || req.user.id }),
  }));
  r.patch("/cleanliness-cases/:id", auth, async (req, res) => {
    const row = await db.get("SELECT * FROM cleanliness_cases WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ error: "not_found" });
    req.body = { ...row, ...req.body, id: row.id };
    if (req.body.after_photo && req.body.before_photo && (!req.body.status || req.body.status === "open")) {
      req.body.status = "cleaned";
    }
    return upsertHandler(db, "cleanliness_cases", SYNCABLE.cleanliness_cases)(req, res);
  });
  r.get("/monitoring-visits", auth, scopedList(db, "monitoring_visits"));
  r.post("/monitoring-visits", auth, async (req, res) => {
    const type = req.body && req.body.target_type;
    const tid = req.body && req.body.target_id;
    if (!["school", "anganwadi"].includes(type)) return res.status(400).json({ error: "invalid_target_type" });
    if (!tid) return res.status(400).json({ error: "target_required" });
    const table = type === "anganwadi" ? "anganwadis" : "schools";
    const row = await db.get(`SELECT id FROM ${table} WHERE id = ?`, [tid]);
    if (!row) return res.status(400).json({ error: "target_not_found" });
    return upsertHandler(db, "monitoring_visits", SYNCABLE.monitoring_visits, {
      defaults: (rq, rec) => ({ user_id: rec.user_id || rq.user.id }),
    })(req, res);
  });
  return r;
};
