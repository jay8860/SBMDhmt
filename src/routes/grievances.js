const { nowISO, uid } = require("../lib/ids");
const { audit, notifyStatus } = require("../lib/audit");
const { scopedList, upsertHandler } = require("../lib/crud");
const SYNCABLE = require("../db/syncable");

module.exports = function grievanceRoutes(db, { auth }) {
  const r = require("express").Router();
  r.get("/grievances", auth, scopedList(db, "grievances"));
  r.post("/grievances", auth, async (req, res) => {
    const handler = upsertHandler(db, "grievances", SYNCABLE.grievances, {
      defaults: (rq, rec) => ({
        raised_by: rec.raised_by || rq.user.id,
        raised_by_name: rec.raised_by_name || rq.user.name,
        status: rec.status || "open",
        ts: rec.ts || nowISO(),
      }),
    });
    const orig = res.json.bind(res);
    res.json = async (row) => {
      if (row && row.category === "garbage_dump") {
        const hid = `hot_grv_${row.id}`;
        const exists = await db.get("SELECT id FROM hotspots WHERE id = ?", [hid]);
        if (!exists) {
          await db.upsert("hotspots", {
            id: hid, ward_id: row.ward_id, name: row.description || "Garbage dump",
            lat: row.lat, lng: row.lng, photo: row.photo,
            cleanliness_status: row.status === "resolved" ? "clean" : "dirty",
            workflow: row.status === "resolved" ? "verified" : "identified",
            notes: row.description, raised_by: row.raised_by, ts: row.ts || nowISO(), updated_at: nowISO(),
          }, "id");
        }
      }
      return orig(row);
    };
    return handler(req, res);
  });
  r.patch("/grievances/:id", auth, async (req, res) => {
    const g = await db.get("SELECT * FROM grievances WHERE id = ?", [req.params.id]);
    if (!g) return res.status(404).json({ error: "not_found" });
    const b = req.body || {};
    const rec = {
      ...g,
      status: b.status || g.status,
      resolution: b.resolution !== undefined ? b.resolution : g.resolution,
      assigned_to: b.assigned_to !== undefined ? b.assigned_to : g.assigned_to,
      priority: b.priority || g.priority,
      resolved_ts: (b.status === "resolved") ? nowISO() : g.resolved_ts,
    };
    await db.upsert("grievances", rec, "id");
    await audit(db, req.user.id, "update", "grievances", rec.id, rec.status);
    if (rec.status !== g.status || rec.assigned_to) {
      await notifyStatus(db, {
        actorId: req.user.id, wardId: rec.ward_id, title: "शिकायत अपडेट", body: rec.status,
        extraUserIds: rec.assigned_to ? [rec.assigned_to] : [],
      });
    }
    res.json(rec);
  });
  return r;
};
