SD.api = async function (path, opts) {
  opts = opts || {};
  const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
  if (SD.S.token) headers.Authorization = "Bearer " + SD.S.token;
  const r = await fetch(path, Object.assign({}, opts, { headers }));
  if (r.status === 401) { if (SD.doLogout) SD.doLogout(true); throw new Error("unauthorised"); }
  if (!r.ok) {
    let e = {}; try { e = await r.json(); } catch (_) {}
    throw new Error(e.error || ("HTTP " + r.status));
  }
  const ct = r.headers.get("content-type") || "";
  if (ct.includes("json")) return r.json();
  return r;
};
