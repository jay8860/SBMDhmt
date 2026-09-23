const { scopedList, upsertHandler } = require("../lib/crud");
const SYNCABLE = require("../db/syncable");
const { notifyStatus } = require("../lib/audit");

module.exports = function greywaterRoutes(db, { auth }) {
  const r = require("express").Router();
  r.get("/greywater", auth, scopedList(db, "greywater_cases"));
  r.post("/greywater", auth, upsertHandler(db, "greywater_cases", SYNCABLE.greywater_cases, {
    defaults: (req, rec) => ({ raised_by: rec.raised_by || req.user.id }),
  }));
  r.patch("/greywater/:id", auth, async (req, res) => {
    const row = await db.get("SELECT * FROM greywater_cases WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ error: "not_found" });
    req.body = { ...row, ...req.body, id: row.id };
    await upsertHandler(db, "greywater_cases", SYNCABLE.greywater_cases)(req, res);
    if (req.body.action_status && req.body.action_status !== row.action_status) {
      await notifyStatus(db, { actorId: req.user.id, wardId: row.ward_id, title: "ग्रेवाटर केस", body: req.body.action_status });
    }
  });
  return r;
};
