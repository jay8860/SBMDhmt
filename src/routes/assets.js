const { scopedList, upsertHandler } = require("../lib/crud");
const SYNCABLE = require("../db/syncable");

module.exports = function assetRoutes(db, { auth }) {
  const r = require("express").Router();
  r.get("/assets", auth, scopedList(db, "assets"));
  r.post("/assets", auth, upsertHandler(db, "assets", SYNCABLE.assets, {
    defaults: (req, rec) => ({ surveyed_by: rec.surveyed_by || req.user.id }),
  }));
  r.put("/assets/:id", auth, async (req, res) => {
    req.body.id = req.params.id;
    return upsertHandler(db, "assets", SYNCABLE.assets, {
      defaults: (req2, rec) => ({ surveyed_by: rec.surveyed_by || req2.user.id }),
    })(req, res);
  });
  return r;
};
