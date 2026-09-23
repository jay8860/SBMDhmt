const { scopedList, upsertHandler } = require("../lib/crud");
const SYNCABLE = require("../db/syncable");

module.exports = function paymentRoutes(db, { auth }) {
  const r = require("express").Router();
  r.get("/payments", auth, scopedList(db, "payments"));
  r.post("/payments", auth, upsertHandler(db, "payments", SYNCABLE.payments, {
    defaults: (req, rec) => ({ user_id: rec.user_id || req.user.id }),
  }));
  return r;
};
