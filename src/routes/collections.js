const { scopedList, upsertHandler } = require("../lib/crud");
const SYNCABLE = require("../db/syncable");

module.exports = function collectionRoutes(db, { auth }) {
  const r = require("express").Router();
  r.get("/collections", auth, scopedList(db, "collections"));
  r.post("/collections", auth, upsertHandler(db, "collections", SYNCABLE.collections, {
    defaults: (req, rec) => ({ user_id: rec.user_id || req.user.id }),
  }));
  return r;
};
