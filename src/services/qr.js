const QRCode = require("qrcode");

async function pngBuffer(code) {
  return QRCode.toBuffer(String(code), { type: "png", width: 400, margin: 1 });
}

async function dataUrl(code) {
  return QRCode.toDataURL(String(code), { width: 220, margin: 1 });
}

module.exports = { pngBuffer, dataUrl };
