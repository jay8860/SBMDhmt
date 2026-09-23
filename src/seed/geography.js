const BLOCKS = [
  { id: "blk_dhamtari", name_hi: "धमतरी (जनपद पंचायत)", name_en: "Dhamtari (Janpad)", kind: "rural", code: "DHM", district_id: "dst_dhamtari" },
  { id: "blk_kurud", name_hi: "कुरुद (जनपद पंचायत)", name_en: "Kurud (Janpad)", kind: "rural", code: "KUR", district_id: "dst_dhamtari" },
  { id: "blk_magarlod", name_hi: "मगरलोड (जनपद पंचायत)", name_en: "Magarlod (Janpad)", kind: "rural", code: "MAG", district_id: "dst_dhamtari" },
  { id: "blk_nagri", name_hi: "नगरी - सिहावा (जनपद पंचायत)", name_en: "Nagri-Sihawa (Janpad)", kind: "rural", code: "NAG", district_id: "dst_dhamtari" },
  { id: "blk_np_dhamtari", name_hi: "नगर पालिक निगम धमतरी", name_en: "Dhamtari Municipal Corporation", kind: "urban", code: "UDM", district_id: "dst_dhamtari" },
  { id: "blk_np_kurud", name_hi: "नगर पंचायत कुरुद", name_en: "Kurud Nagar Panchayat", kind: "urban", code: "UKU", district_id: "dst_dhamtari" },
  { id: "blk_np_nagri", name_hi: "नगर पंचायत नगरी", name_en: "Nagri Nagar Panchayat", kind: "urban", code: "UNG", district_id: "dst_dhamtari" },
  { id: "blk_np_amdi", name_hi: "नगर पंचायत आमदी", name_en: "Amdi Nagar Panchayat", kind: "urban", code: "UAM", district_id: "dst_dhamtari" },
  { id: "blk_np_bhakhara", name_hi: "नगर पंचायत भखारा", name_en: "Bhakhara Nagar Panchayat", kind: "urban", code: "UBH", district_id: "dst_dhamtari" },
  { id: "blk_np_magarlod", name_hi: "नगर पंचायत मगरलोड", name_en: "Magarlod Nagar Panchayat", kind: "urban", code: "UMG", district_id: "dst_dhamtari" },
];

const GPS = {
  blk_dhamtari: [["अर्जुनी", "Arjuni"], ["कोलियारी", "Koliyari"], ["संबलपुर", "Sambalpur"], ["परसतराई", "Parastarai"], ["भोथीडीह", "Bhothidih"], ["खरतुली", "Khartuli"], ["सिहावा रोड", "Sihawa Road"], ["लोहरसी", "Loharsi"]],
  blk_kurud: [["भखारा", "Bhakhara"], ["चरमुड़िया", "Charmudiya"], ["कोर्रा", "Korra"], ["जोरातराई", "Joratarai"], ["नारी", "Nari"], ["बगदेही", "Bagdehi"], ["सिर्री", "Sirri"], ["बोरसी", "Borsi"]],
  blk_magarlod: [["मगरलोड", "Magarlod"], ["सांकरा", "Sankra"], ["भोथीपार", "Bhothipar"], ["कोर्रा (म)", "Korra (M)"], ["बिरेतरा", "Biretara"], ["चारमुड़िया", "Charmudiya (M)"]],
  blk_nagri: [["नगरी", "Nagri"], ["सिहावा", "Sihawa"], ["बेलरगांव", "Belargaon"], ["दुगली", "Dugli"], ["सांकरा (न)", "Sankra (N)"], ["बोराई", "Borai"], ["मेचका", "Mechka"], ["कौहाबहरा", "Kauhabahra"]],
};

const URBAN_WARDS = {
  blk_np_dhamtari: 40, blk_np_kurud: 15, blk_np_nagri: 15,
  blk_np_amdi: 15, blk_np_bhakhara: 15, blk_np_magarlod: 15,
};

const STATE = { id: "st_cg", name_hi: "छत्तीसगढ़", name_en: "Chhattisgarh", code: "CG" };
const DISTRICTS = [
  { id: "dst_dhamtari", state_id: "st_cg", name_hi: "धमतरी", name_en: "Dhamtari", code: "DMT" },
  { id: "dst_sukma", state_id: "st_cg", name_hi: "सुकमा", name_en: "Sukma", code: "SKM" },
];

function ri(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

function buildWards() {
  const wards = [];
  for (const [blockId, list] of Object.entries(GPS)) {
    const blk = BLOCKS.find((b) => b.id === blockId);
    list.forEach(([hi, en], i) => {
      wards.push({
        id: `wrd_${blk.code}_${i + 1}`.toLowerCase(),
        block_id: blockId,
        name_hi: `ग्राम पंचायत ${hi}`,
        name_en: `GP ${en}`,
        kind: "gp",
        code: `${blk.code}${String(i + 1).padStart(2, "0")}`,
        target_households: ri(180, 620),
      });
    });
  }
  for (const [blockId, count] of Object.entries(URBAN_WARDS)) {
    const blk = BLOCKS.find((b) => b.id === blockId);
    for (let i = 1; i <= count; i++) {
      wards.push({
        id: `wrd_${blk.code}_${i}`.toLowerCase(),
        block_id: blockId,
        name_hi: `वार्ड क्र. ${i}`,
        name_en: `Ward ${i}`,
        kind: "ward",
        code: `${blk.code}${String(i).padStart(2, "0")}`,
        target_households: ri(150, 450),
      });
    }
  }
  return wards;
}

module.exports = { BLOCKS, GPS, URBAN_WARDS, STATE, DISTRICTS, buildWards, ri };
