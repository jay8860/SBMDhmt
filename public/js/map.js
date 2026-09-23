SD.showMap = function (el, points) {
  if (!el || !window.L) return;
  const pts = (points || []).filter((p) => p && p.lat && p.lng);
  const map = L.map(el).setView(pts[0] ? [pts[0].lat, pts[0].lng] : [20.7, 81.55], pts.length ? 13 : 8);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OSM" }).addTo(map);
  pts.forEach((p) => L.marker([p.lat, p.lng]).addTo(map).bindPopup(p.label || ""));
  if (pts.length > 1) map.fitBounds(pts.map((p) => [p.lat, p.lng]), { padding: [20, 20] });
  setTimeout(() => map.invalidateSize(), 200);
  return map;
};
