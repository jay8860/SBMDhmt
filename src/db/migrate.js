async function migrate(db) {
  const T = "TEXT";
  const stmts = [
    `CREATE TABLE IF NOT EXISTS states (
      id ${T} PRIMARY KEY, name_hi ${T} NOT NULL, name_en ${T} NOT NULL, code ${T})`,
    `CREATE TABLE IF NOT EXISTS districts (
      id ${T} PRIMARY KEY, state_id ${T} NOT NULL, name_hi ${T} NOT NULL, name_en ${T} NOT NULL, code ${T})`,
    `CREATE TABLE IF NOT EXISTS blocks (
      id ${T} PRIMARY KEY, name_hi ${T} NOT NULL, name_en ${T} NOT NULL,
      kind ${T} NOT NULL DEFAULT 'rural', code ${T}, district_id ${T})`,
    `CREATE TABLE IF NOT EXISTS wards (
      id ${T} PRIMARY KEY, block_id ${T} NOT NULL, name_hi ${T} NOT NULL, name_en ${T} NOT NULL,
      kind ${T} NOT NULL DEFAULT 'gp', code ${T}, target_households INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS users (
      id ${T} PRIMARY KEY, name ${T} NOT NULL, phone ${T} UNIQUE NOT NULL, pin ${T} NOT NULL,
      role ${T} NOT NULL, block_id ${T}, ward_id ${T}, shg_name ${T},
      active INTEGER NOT NULL DEFAULT 1, created_at ${T}, aadhaar ${T}, district_id ${T})`,
    `CREATE TABLE IF NOT EXISTS user_assignments (
      id ${T} PRIMARY KEY, user_id ${T} NOT NULL, village_id ${T}, ward_id ${T})`,
    `CREATE TABLE IF NOT EXISTS households (
      id ${T} PRIMARY KEY, code ${T} UNIQUE NOT NULL, head_name ${T} NOT NULL, phone ${T},
      ward_id ${T} NOT NULL, house_no ${T}, category ${T} NOT NULL DEFAULT 'household',
      fee_slab INTEGER NOT NULL DEFAULT 0, family_size INTEGER, lat REAL, lng REAL,
      toilet INTEGER DEFAULT 1, soak_pit INTEGER DEFAULT 0, compost_pit INTEGER DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1, created_by ${T}, created_at ${T}, updated_at ${T})`,
    `CREATE TABLE IF NOT EXISTS collections (
      id ${T} PRIMARY KEY, household_id ${T} NOT NULL, ward_id ${T}, user_id ${T} NOT NULL,
      ts ${T} NOT NULL, service_date ${T} NOT NULL, wet_kg REAL DEFAULT 0, dry_kg REAL DEFAULT 0,
      hazard_kg REAL DEFAULT 0, segregated INTEGER DEFAULT 1, status ${T} DEFAULT 'collected',
      lat REAL, lng REAL, photo ${T}, notes ${T}, created_at ${T})`,
    `CREATE TABLE IF NOT EXISTS payments (
      id ${T} PRIMARY KEY, household_id ${T} NOT NULL, ward_id ${T}, user_id ${T} NOT NULL,
      amount REAL NOT NULL, period ${T} NOT NULL, mode ${T} DEFAULT 'cash', receipt_no ${T},
      ts ${T} NOT NULL, lat REAL, lng REAL, notes ${T}, created_at ${T})`,
    `CREATE TABLE IF NOT EXISTS grievances (
      id ${T} PRIMARY KEY, household_id ${T}, ward_id ${T}, block_id ${T}, category ${T} NOT NULL,
      description ${T}, status ${T} NOT NULL DEFAULT 'open', priority ${T} DEFAULT 'normal',
      raised_by ${T}, raised_by_name ${T}, ts ${T} NOT NULL, lat REAL, lng REAL, photo ${T},
      assigned_to ${T}, resolution ${T}, resolved_ts ${T}, created_at ${T})`,
    `CREATE TABLE IF NOT EXISTS assets (
      id ${T} PRIMARY KEY, asset_type ${T} NOT NULL, name ${T} NOT NULL, ward_id ${T}, block_id ${T},
      condition ${T} DEFAULT 'functional', capacity ${T}, ownership ${T}, lat REAL, lng REAL,
      photo ${T}, notes ${T}, surveyed_by ${T}, ts ${T}, created_at ${T},
      toilet_count INTEGER, reason ${T}, installed_on ${T})`,
    `CREATE TABLE IF NOT EXISTS attendance (
      id ${T} PRIMARY KEY, user_id ${T} NOT NULL, ward_id ${T}, service_date ${T} NOT NULL,
      in_ts ${T}, out_ts ${T}, lat REAL, lng REAL, created_at ${T})`,
    `CREATE TABLE IF NOT EXISTS sessions (
      token ${T} PRIMARY KEY, user_id ${T} NOT NULL, created_at ${T})`,
    `CREATE TABLE IF NOT EXISTS gp_profiles (
      id ${T} PRIMARY KEY, ward_id ${T} UNIQUE NOT NULL, sarpanch_name ${T}, sarpanch_mobile ${T},
      secretary_name ${T}, secretary_mobile ${T}, updated_at ${T})`,
    `CREATE TABLE IF NOT EXISTS villages (
      id ${T} PRIMARY KEY, ward_id ${T} NOT NULL, name_hi ${T} NOT NULL, name_en ${T} NOT NULL, code ${T},
      fam_st INTEGER DEFAULT 0, fam_sc INTEGER DEFAULT 0, fam_obc INTEGER DEFAULT 0, fam_gen INTEGER DEFAULT 0, fam_total INTEGER DEFAULT 0,
      pop_st INTEGER DEFAULT 0, pop_sc INTEGER DEFAULT 0, pop_obc INTEGER DEFAULT 0, pop_gen INTEGER DEFAULT 0, pop_total INTEGER DEFAULT 0,
      updated_at ${T})`,
    `CREATE TABLE IF NOT EXISTS schools (
      id ${T} PRIMARY KEY, ward_id ${T}, village_id ${T}, name ${T} NOT NULL, kind ${T} DEFAULT 'coed',
      toilets_total INTEGER DEFAULT 0, toilets_functional INTEGER DEFAULT 0, toilets_non_functional INTEGER DEFAULT 0,
      lat REAL, lng REAL, photo ${T}, notes ${T}, updated_at ${T})`,
    `CREATE TABLE IF NOT EXISTS anganwadis (
      id ${T} PRIMARY KEY, ward_id ${T}, village_id ${T}, name ${T} NOT NULL,
      toilets_total INTEGER DEFAULT 0, toilets_functional INTEGER DEFAULT 0, toilets_non_functional INTEGER DEFAULT 0,
      lat REAL, lng REAL, photo ${T}, notes ${T}, updated_at ${T})`,
    `CREATE TABLE IF NOT EXISTS buildings (
      id ${T} PRIMARY KEY, ward_id ${T}, village_id ${T}, kind ${T} NOT NULL DEFAULT 'gov', name ${T} NOT NULL,
      toilets_total INTEGER DEFAULT 0, toilets_functional INTEGER DEFAULT 0, toilets_non_functional INTEGER DEFAULT 0,
      lat REAL, lng REAL, photo ${T}, notes ${T}, updated_at ${T})`,
    `CREATE TABLE IF NOT EXISTS ihhl (
      id ${T} PRIMARY KEY, household_id ${T} NOT NULL, ward_id ${T}, status ${T} DEFAULT 'approved',
      lat REAL, lng REAL, photo ${T}, incentive_amount REAL, incentive_status ${T}, incentive_date ${T},
      notes ${T}, updated_by ${T}, updated_at ${T})`,
    `CREATE TABLE IF NOT EXISTS hotspots (
      id ${T} PRIMARY KEY, ward_id ${T}, name ${T} NOT NULL, lat REAL, lng REAL, photo ${T},
      cleanliness_status ${T} DEFAULT 'dirty', workflow ${T} DEFAULT 'identified',
      notes ${T}, raised_by ${T}, ts ${T}, updated_at ${T})`,
    `CREATE TABLE IF NOT EXISTS cleanliness_cases (
      id ${T} PRIMARY KEY, ward_id ${T}, hotspot_id ${T}, school_id ${T}, anganwadi_id ${T},
      location_name ${T}, lat REAL, lng REAL, garbage_qty_kg REAL, before_photo ${T}, after_photo ${T},
      uploaded_by ${T}, status ${T} DEFAULT 'open', ts ${T}, updated_at ${T})`,
    `CREATE TABLE IF NOT EXISTS monitoring_visits (
      id ${T} PRIMARY KEY, ward_id ${T}, target_type ${T} NOT NULL, target_id ${T} NOT NULL,
      activity ${T}, observation ${T}, status ${T} DEFAULT 'observed', photo ${T},
      lat REAL, lng REAL, user_id ${T}, ts ${T})`,
    `CREATE TABLE IF NOT EXISTS greywater_cases (
      id ${T} PRIMARY KEY, ward_id ${T}, accumulates INTEGER DEFAULT 1, location_name ${T},
      problem ${T}, proposed_action ${T}, action_status ${T} DEFAULT 'open',
      janpad_submitted_on ${T}, soak_pit_asset_id ${T}, lat REAL, lng REAL, photo ${T},
      raised_by ${T}, ts ${T}, updated_at ${T})`,
    `CREATE TABLE IF NOT EXISTS swm_gp (
      id ${T} PRIMARY KEY, ward_id ${T} UNIQUE NOT NULL, shed_available INTEGER DEFAULT 0, shed_usage ${T},
      dtd_happening INTEGER DEFAULT 0, dtd_reason ${T}, dtd_frequency ${T}, dtd_days_per_week INTEGER,
      segregation_happens INTEGER DEFAULT 0, segregation_reason ${T}, segregation_location ${T},
      kit_available INTEGER DEFAULT 0, kit_status ${T}, updated_at ${T})`,
    `CREATE TABLE IF NOT EXISTS waste_sales (
      id ${T} PRIMARY KEY, ward_id ${T}, waste_type ${T}, qty_kg REAL, sale_date ${T}, buyer ${T},
      notes ${T}, created_by ${T}, created_at ${T})`,
    `CREATE TABLE IF NOT EXISTS pwmu_shipments (
      id ${T} PRIMARY KEY, ward_id ${T}, qty REAL, unit ${T} DEFAULT 'kg', ship_date ${T}, destination ${T},
      notes ${T}, created_by ${T}, created_at ${T})`,
    `CREATE TABLE IF NOT EXISTS honorarium (
      id ${T} PRIMARY KEY, ward_id ${T}, paid INTEGER DEFAULT 0, reason ${T},
      amount_per_person REAL, people INTEGER, months INTEGER, total REAL, period ${T},
      notes ${T}, updated_at ${T})`,
    `CREATE TABLE IF NOT EXISTS waste_category_totals (
      id ${T} PRIMARY KEY, ward_id ${T}, period ${T}, plastic_kg REAL DEFAULT 0, metal_kg REAL DEFAULT 0,
      glass_kg REAL DEFAULT 0, mixed_kg REAL DEFAULT 0, updated_at ${T})`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id ${T} PRIMARY KEY, actor_id ${T}, action ${T}, table_name ${T}, row_id ${T}, detail ${T}, ts ${T})`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id ${T} PRIMARY KEY, user_id ${T}, title ${T}, body ${T}, read_at ${T}, ts ${T})`,
    `CREATE INDEX IF NOT EXISTS idx_hh_ward ON households(ward_id)`,
    `CREATE INDEX IF NOT EXISTS idx_col_date ON collections(service_date)`,
    `CREATE INDEX IF NOT EXISTS idx_col_hh ON collections(household_id)`,
    `CREATE INDEX IF NOT EXISTS idx_pay_hh ON payments(household_id)`,
    `CREATE INDEX IF NOT EXISTS idx_wards_block ON wards(block_id)`,
    `CREATE INDEX IF NOT EXISTS idx_villages_ward ON villages(ward_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ihhl_hh ON ihhl(household_id)`,
    `CREATE INDEX IF NOT EXISTS idx_hotspots_ward ON hotspots(ward_id)`,
  ];
  for (const s of stmts) await db.exec(s);

  await db.addColumn("blocks", "district_id TEXT");
  await db.addColumn("users", "aadhaar TEXT");
  await db.addColumn("users", "district_id TEXT");
  await db.addColumn("assets", "toilet_count INTEGER");
  await db.addColumn("assets", "reason TEXT");
  await db.addColumn("assets", "installed_on TEXT");
}

module.exports = migrate;
