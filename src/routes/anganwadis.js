const { scopedList, upsertHandler } = require("../lib/crud");
const SYNCABLE = require("../db/syncable");

module.exports = function anganwadiRoutes(db, { auth }) {
  const r = require("express").Router();
  r.get("/anganwadis", auth, scopedList(db, "anganwadis"));
  r.post("/anganwadis", auth, upsertHandler(db, "anganwadis", SYNCABLE.anganwadis));
  r.put("/anganwadis/:id", auth, async (req, res) => {
    req.body.id = req.params.id;
    return upsertHandler(db, "anganwadis", SYNCABLE.anganwadis)(req, res);
  });
  return r;
};
