const { uid, nowISO } = require("./ids");

async function audit(db, actorId, action, table, rowId, detail) {
  try {
    await db.upsert("audit_logs", {
      id: uid("aud_"),
      actor_id: actorId || null,
      action,
      table_name: table,
      row_id: rowId || null,
      detail: detail ? String(detail).slice(0, 500) : null,
      ts: nowISO(),
    }, "id");
  } catch (e) {
    console.warn("audit failed", e.message);
  }
}

async function notify(db, userId, title, body) {
  if (!userId) return;
  try {
    await db.upsert("notifications", {
      id: uid("ntf_"),
      user_id: userId,
      title,
      body: body || null,
      read_at: null,
      ts: nowISO(),
    }, "id");
  } catch (e) {
    console.warn("notify failed", e.message);
  }
}

async function notifyStatus(db, { actorId, wardId, title, body, extraUserIds }) {
  const ids = new Set();
  if (actorId) ids.add(actorId);
  (extraUserIds || []).forEach((id) => { if (id) ids.add(id); });
  if (wardId) {
    try {
      const gps = await db.all("SELECT id FROM users WHERE role = 'gp' AND ward_id = ? AND active = 1", [wardId]);
      gps.forEach((u) => ids.add(u.id));
    } catch (_) { /* ignore */ }
  }
  for (const id of ids) await notify(db, id, title, body);
}

module.exports = { audit, notify, notifyStatus };
