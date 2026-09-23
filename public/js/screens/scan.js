SD.screens.scan = function () {
  if (!SD.isField(SD.S.user)) return SD.screens.dashboard();
  SD.shell(`${SD.statusHTML()}<div class="card"><h3>📷 ${SD.esc(t("scan_qr"))}</h3>
    <div id="scanWrap"><video id="scanVid" playsinline muted></video><div class="frame"></div></div>
    <p class="hint" style="text-align:center">${SD.esc(t("scan_hint"))}</p></div>
    <div class="card"><h3>${SD.esc(t("enter_code"))}</h3>
    <form id="cf"><div class="row"><input name="code" placeholder="DHM-DHM01-0001"><button class="btn" type="submit">→</button></div></form>
    <div style="height:10px"></div><button class="btn sec" id="pickList">📋 ${SD.esc(t("pick_from_list"))}</button></div>`);
  SD.$("#cf").onsubmit = (e) => { e.preventDefault(); SD.openByCode(new FormData(e.target).get("code").trim()); };
  SD.$("#pickList").onclick = () => SD.pickHousehold((h) => SD.collectionSheet(h));
  SD.startCamera();
};
SD.stopScanner = function () {
  if (SD._scanRAF) cancelAnimationFrame(SD._scanRAF); SD._scanRAF = null;
  if (SD._scanStream) { SD._scanStream.getTracks().forEach((tr) => tr.stop()); SD._scanStream = null; }
};
SD.startCamera = async function () {
  const vid = document.getElementById("scanVid"); if (!vid) return;
  try {
    SD._scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    vid.srcObject = SD._scanStream; await vid.play();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const tick = () => {
      SD._scanRAF = requestAnimationFrame(tick);
      if (vid.readyState !== 4) return;
      const w = 420, h = Math.round((vid.videoHeight / vid.videoWidth) * w) || 420;
      canvas.width = w; canvas.height = h; ctx.drawImage(vid, 0, 0, w, h);
      try {
        const img = ctx.getImageData(0, 0, w, h);
        const code = window.jsQR && window.jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
        if (code && code.data) { SD.stopScanner(); SD.openByCode(code.data.trim()); }
      } catch (_) {}
    };
    tick();
  } catch (e) {
    const wrap = document.getElementById("scanWrap");
    if (wrap) wrap.innerHTML = `<div style="padding:40px;color:#fff;text-align:center">${SD.esc(t("camera_denied"))}</div>`;
  }
};
SD.openByCode = async function (code) {
  if (!code) return;
  let h = SD.S.data.households.find((x) => x.code === code || x.id === code);
  if (!h && navigator.onLine) { try { h = await SD.api("/api/households/by-code/" + encodeURIComponent(code)); } catch (e) { h = null; } }
  if (!h) { SD.toast(t("hh_not_found")); SD.startCamera(); return; }
  SD.collectionSheet(h);
};
