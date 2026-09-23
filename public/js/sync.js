SD.scheduleSync = function (delay) {
  clearTimeout(SD._syncTimer);
  SD._syncTimer = setTimeout(() => { if (navigator.onLine) SD.sync(true); }, delay == null ? 1200 : delay);
};
SD.bootstrap = async function () {
  const d = await SD.api("/api/bootstrap");
  SD.S.user = d.user;
  SD.S.data = Object.assign(SD.emptyData(), d);
  SD.TABLES.forEach((tb) => {
    (SD.S.outbox[tb] || []).forEach((r) => {
      const i = SD.S.data[tb].findIndex((x) => x.id === r.id);
      if (i >= 0) SD.S.data[tb][i] = r; else SD.S.data[tb].unshift(r);
    });
  });
  SD.save.data(); SD.save.auth();
};
SD.sync = async function (quiet) {
  if (SD.S.syncing || !SD.S.token) return;
  if (!navigator.onLine) { if (!quiet) SD.toast(t("offline")); return; }
  const n = SD.pendingCount();
  SD.S.syncing = true; if (!quiet) SD.toast(t("syncing")); if (SD.renderStatus) SD.renderStatus();
  try {
    if (n > 0) {
      const body = {};
      SD.TABLES.forEach((k) => (body[k] = SD.S.outbox[k]));
      const r = await SD.api("/api/sync", { method: "POST", body: JSON.stringify(body) });
      if (r.ok || r.accepted) { SD.S.outbox = SD.emptyOutbox(); SD.save.outbox(); }
    }
    await SD.bootstrap();
    if (!quiet) SD.toast(t("synced"));
  } catch (e) {
    console.warn("sync failed", e);
    if (!quiet) SD.toast(t("sync_fail"));
  } finally {
    SD.S.syncing = false;
    if (SD.render) SD.render();
  }
};
