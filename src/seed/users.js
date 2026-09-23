function staffUsers() {
  return [
    { id: "usr_state", name: "राज्य प्रशासक (SBM)", phone: "9000000000", role: "state_admin", pin: "1234", district_id: null },
    { id: "usr_admin", name: "जिला नोडल अधिकारी (SBM)", phone: "9000000001", role: "admin", pin: "1234", district_id: "dst_dhamtari" },
    { id: "usr_ceo", name: "CEO जिला पंचायत (दर्शक)", phone: "9000000002", role: "viewer", pin: "1234", district_id: "dst_dhamtari" },
    { id: "usr_sup_dhm", name: "ब्लॉक समन्वयक — धमतरी", phone: "9000000011", role: "supervisor", block_id: "blk_dhamtari", pin: "1234", district_id: "dst_dhamtari" },
    { id: "usr_sup_kur", name: "ब्लॉक समन्वयक — कुरुद", phone: "9000000012", role: "supervisor", block_id: "blk_kurud", pin: "1234", district_id: "dst_dhamtari" },
    { id: "usr_sup_udm", name: "स्वच्छता प्रभारी — नगर निगम धमतरी", phone: "9000000013", role: "supervisor", block_id: "blk_np_dhamtari", pin: "1234", district_id: "dst_dhamtari" },
    { id: "usr_gp_1", name: "ग्राम पंचायत सचिव — अर्जुनी", phone: "9000000201", role: "gp", block_id: "blk_dhamtari", ward_id: "wrd_dhm_1", pin: "1234", district_id: "dst_dhamtari" },
  ];
}

const DIDI_NAMES = ["सुनीता साहू", "गीता ध्रुव", "लक्ष्मी निषाद", "दुर्गा नेताम", "संतोषी यादव", "फूलबाई मरकाम"];
const SHG = ["जय माँ दुर्गा स्व-सहायता समूह", "शीतला महिला समूह", "गंगा स्व-सहायता समूह", "सरस्वती महिला समूह", "आदिक्षक्ति समूह", "नर्मदा महिला समूह"];

module.exports = { staffUsers, DIDI_NAMES, SHG };
