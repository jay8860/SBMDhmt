const { scopedList, upsertHandler } = require("../lib/crud");
const SYNCABLE = require("../db/syncable");
const { notifyStatus, audit } = require("../lib/audit");

const ORDER = ["approved", "under_construction", "completed", "geotagged", "incentive_paid"];

module.exports = function ihhlRoutes(db, { auth }) {
  const r = require("express").Router();
  r.get("/ihhl", auth, scopedList(db, "ihhl"));
  r.post("/ihhl", auth, async (req, res) => {
    if (req.body && req.body.id && req.body.status) {
      const row = await db.get("SELECT * FROM ihhl WHERE id = ?", [req.body.id]);
      if (row) {
        const from = ORDER.indexOf(row.status);
        const to = ORDER.indexOf(req.body.status);
        if (to >= 0 && from >= 0 && to < from) return res.status(400).json({ error: "status_must_move_forward" });
      }
    }
    return upsertHandler(db, "ihhl", SYNCABLE.ihhl, {
      defaults: (req2, rec) => ({ updated_by: req2.user.id, status: rec.status || "approved" }),
    })(req, res);
  });
  r.patch("/ihhl/:id", auth, async (req, res) => {
    const row = await db.get("SELECT * FROM ihhl WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ error: "not_found" });
    const next = req.body.status;
    if (next) {
      const from = ORDER.indexOf(row.status);
      const to = ORDER.indexOf(next);
      if (to < from) return res.status(400).json({ error: "status_must_move_forward" });
    }
    req.body = { ...row, ...req.body, id: row.id, updated_by: req.user.id };
    const handler = upsertHandler(db, "ihhl", SYNCABLE.ihhl);
    await handler(req, res);
    if (next && next !== row.status) {
      await audit(db, req.user.id, "status", "ihhl", row.id, next);
      await notifyStatus(db, { actorId: req.user.id, wardId: row.ward_id, title: "IHHL स्थिति", body: next });
    }
  });
  return r;
};
