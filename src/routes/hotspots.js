const { scopedList, upsertHandler } = require("../lib/crud");
const SYNCABLE = require("../db/syncable");
const { notifyStatus } = require("../lib/audit");

const FLOW = ["identified", "reported", "cleaning", "verified"];

module.exports = function hotspotRoutes(db, { auth }) {
  const r = require("express").Router();
  r.get("/hotspots", auth, scopedList(db, "hotspots"));
  r.post("/hotspots", auth, async (req, res) => {
    if (req.body && req.body.id && req.body.workflow) {
      const row = await db.get("SELECT workflow FROM hotspots WHERE id = ?", [req.body.id]);
      if (row) {
        const from = FLOW.indexOf(row.workflow);
        const to = FLOW.indexOf(req.body.workflow);
        if (to >= 0 && from >= 0 && to < from) return res.status(400).json({ error: "workflow_must_move_forward" });
      }
    }
    return upsertHandler(db, "hotspots", SYNCABLE.hotspots, {
      defaults: (req2, rec) => ({ raised_by: rec.raised_by || req2.user.id, workflow: rec.workflow || "identified" }),
    })(req, res);
  });
  r.patch("/hotspots/:id", auth, async (req, res) => {
    const row = await db.get("SELECT * FROM hotspots WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ error: "not_found" });
    if (req.body.workflow) {
      const from = FLOW.indexOf(row.workflow);
      const to = FLOW.indexOf(req.body.workflow);
      if (to < from) return res.status(400).json({ error: "workflow_must_move_forward" });
    }
    req.body = { ...row, ...req.body, id: row.id };
    await upsertHandler(db, "hotspots", SYNCABLE.hotspots)(req, res);
    if (req.body.workflow && req.body.workflow !== row.workflow) {
      await notifyStatus(db, { actorId: req.user.id, wardId: row.ward_id, title: "हॉटस्पॉट", body: req.body.workflow });
    }
  });
  return r;
};
