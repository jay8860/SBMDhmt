const { scopedList, upsertHandler } = require("../lib/crud");
const SYNCABLE = require("../db/syncable");

const KINDS = ["boys", "girls", "coed"];

module.exports = function schoolRoutes(db, { auth }) {
  const r = require("express").Router();
  r.get("/schools", auth, scopedList(db, "schools"));
  r.post("/schools", auth, async (req, res) => {
    if (req.body.kind && !KINDS.includes(req.body.kind)) return res.status(400).json({ error: "invalid_kind" });
    return upsertHandler(db, "schools", SYNCABLE.schools)(req, res);
  });
  r.put("/schools/:id", auth, async (req, res) => {
    req.body.id = req.params.id;
    if (req.body.kind && !KINDS.includes(req.body.kind)) return res.status(400).json({ error: "invalid_kind" });
    return upsertHandler(db, "schools", SYNCABLE.schools)(req, res);
  });
  return r;
};
