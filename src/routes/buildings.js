const { scopedList, upsertHandler } = require("../lib/crud");
const SYNCABLE = require("../db/syncable");

const KINDS = ["gov", "community"];

module.exports = function buildingRoutes(db, { auth }) {
  const r = require("express").Router();
  r.get("/buildings", auth, scopedList(db, "buildings"));
  r.post("/buildings", auth, async (req, res) => {
    if (req.body.kind && !KINDS.includes(req.body.kind)) return res.status(400).json({ error: "invalid_kind" });
    return upsertHandler(db, "buildings", SYNCABLE.buildings)(req, res);
  });
  r.put("/buildings/:id", auth, async (req, res) => {
    req.body.id = req.params.id;
    if (req.body.kind && !KINDS.includes(req.body.kind)) return res.status(400).json({ error: "invalid_kind" });
    return upsertHandler(db, "buildings", SYNCABLE.buildings)(req, res);
  });
  return r;
};
