import * as SQLite from 'expo-sqlite';

let database;
let databasePromise;

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = openAndMigrateDatabase();
  }
  return databasePromise;
}

async function openAndMigrateDatabase() {
  const db = await SQLite.openDatabaseAsync('organic_garden.db');
  await migrate(db);
  database = db;
  return db;
}

async function resetDatabase() {
  const db = database;
  database = undefined;
  databasePromise = undefined;
  try {
    await db?.closeAsync?.();
  } catch {
    // Reopening is more important than surfacing a close failure here.
  }
}

function shouldRetryDatabaseOpen(error) {
  const message = String(error?.message || error || '');
  return (
    message.includes('NativeDatabase.prepareAsync') ||
    message.includes('NullPointerException')
  );
}

async function runDatabaseOperation(operation) {
  try {
    return await operation(await getDatabase());
  } catch (error) {
    if (!shouldRetryDatabaseOpen(error)) {
      throw error;
    }
    await resetDatabase();
    return operation(await getDatabase());
  }
}

async function migrate(db) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS plants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      variety TEXT,
      category TEXT NOT NULL,
      purchase_date TEXT NOT NULL,
      health_status TEXT NOT NULL,
      image_uri TEXT,
      notes TEXT,
      water_every_days INTEGER NOT NULL DEFAULT 2,
      fertilizer_every_days INTEGER NOT NULL DEFAULT 15,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
  await removeDuplicatePlants(db);
}

export async function getSetting(key, fallback) {
  const row = await runDatabaseOperation((db) =>
    db.getFirstAsync('SELECT value FROM settings WHERE key = ?', [key])
  );
  return row?.value ?? fallback;
}

export async function setSetting(key, value) {
  await runDatabaseOperation((db) =>
    db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value]
    )
  );
}

export async function getAllSettings() {
  const rows = await runDatabaseOperation((db) =>
    db.getAllAsync('SELECT key, value FROM settings')
  );
  return rows.reduce((settings, row) => {
    settings[row.key] = row.value;
    return settings;
  }, {});
}

export async function createPlant(plant) {
  const now = new Date().toISOString();
  const result = await runDatabaseOperation((db) =>
    db.runAsync(
      `INSERT INTO plants
        (name, variety, category, purchase_date, health_status, image_uri, notes, water_every_days, fertilizer_every_days, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        plant.name.trim(),
        plant.variety.trim(),
        plant.category,
        plant.purchaseDate,
        plant.healthStatus,
        plant.imageUri || null,
        plant.notes.trim(),
        Number(plant.waterEveryDays) || 2,
        Number(plant.fertilizerEveryDays) || 15,
        now,
      ]
    )
  );
  return result.lastInsertRowId;
}

export async function updatePlant(id, plant) {
  await runDatabaseOperation((db) =>
    db.runAsync(
      `UPDATE plants SET
        name = ?,
        variety = ?,
        category = ?,
        purchase_date = ?,
        health_status = ?,
        image_uri = ?,
        notes = ?,
        water_every_days = ?,
        fertilizer_every_days = ?
        WHERE id = ?`,
      [
        plant.name.trim(),
        plant.variety.trim(),
        plant.category,
        plant.purchaseDate,
        plant.healthStatus,
        plant.imageUri || null,
        plant.notes.trim(),
        Number(plant.waterEveryDays) || 2,
        Number(plant.fertilizerEveryDays) || 15,
        Number(id),
      ]
    )
  );
}

export async function deletePlant(id) {
  await runDatabaseOperation((db) =>
    db.runAsync('DELETE FROM plants WHERE id = ?', [Number(id)])
  );
}

export async function importPlants(plants = []) {
  const result = {
    total: plants.length,
    inserted: 0,
    skipped: 0,
    removedDuplicates: 0,
  };

  await runDatabaseOperation((db) => db.withTransactionAsync(async () => {
    result.removedDuplicates = await removeDuplicatePlants(db);
    const existingRows = await db.getAllAsync('SELECT * FROM plants');
    const existingKeys = new Set(existingRows.map(getPlantImportKey));

    for (const plant of plants) {
      const normalizedPlant = normalizeImportedPlant(plant);
      if (!normalizedPlant.name) {
        result.skipped += 1;
        continue;
      }

      const importKey = getPlantImportKey(normalizedPlant);
      if (existingKeys.has(importKey)) {
        result.skipped += 1;
        continue;
      }

      await db.runAsync(
        `INSERT INTO plants
          (name, variety, category, purchase_date, health_status, image_uri, notes, water_every_days, fertilizer_every_days, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          normalizedPlant.name,
          normalizedPlant.variety,
          normalizedPlant.category,
          normalizedPlant.purchase_date,
          normalizedPlant.health_status,
          normalizedPlant.image_uri,
          normalizedPlant.notes,
          normalizedPlant.water_every_days,
          normalizedPlant.fertilizer_every_days,
          normalizedPlant.created_at,
        ]
      );
      existingKeys.add(importKey);
      result.inserted += 1;
    }
  }));

  return result;
}

async function removeDuplicatePlants(db) {
  const rows = await db.getAllAsync('SELECT * FROM plants ORDER BY id ASC');
  const seenKeys = new Set();
  let removedCount = 0;

  for (const row of rows) {
    const importKey = getPlantImportKey(row);
    if (seenKeys.has(importKey)) {
      await db.runAsync('DELETE FROM plants WHERE id = ?', [Number(row.id)]);
      removedCount += 1;
      continue;
    }
    seenKeys.add(importKey);
  }

  return removedCount;
}

function normalizeImportedPlant(plant = {}) {
  const now = new Date().toISOString();
  return {
    name: String(plant.name || '').trim(),
    variety: String(plant.variety || '').trim(),
    category: plant.category || 'Indoor',
    purchase_date: plant.purchase_date || plant.purchaseDate || now.slice(0, 10),
    health_status: plant.health_status || plant.healthStatus || 'Healthy',
    image_uri: plant.image_uri || plant.imageUri || null,
    notes: String(plant.notes || '').trim(),
    water_every_days: Number(plant.water_every_days || plant.waterEveryDays) || 2,
    fertilizer_every_days: Number(plant.fertilizer_every_days || plant.fertilizerEveryDays) || 15,
    created_at: plant.created_at || now,
  };
}

function getPlantImportKey(plant) {
  return [
    plant.name,
    plant.variety,
    plant.category,
    plant.purchase_date,
    plant.health_status,
    plant.image_uri || '',
    plant.notes,
    plant.water_every_days,
    plant.fertilizer_every_days,
  ].map((value) => String(value ?? '')).join('\u001f');
}

export async function listPlants() {
  return runDatabaseOperation((db) =>
    db.getAllAsync('SELECT * FROM plants ORDER BY name COLLATE NOCASE ASC, created_at DESC')
  );
}

export async function getPlant(id) {
  return runDatabaseOperation((db) =>
    db.getFirstAsync('SELECT * FROM plants WHERE id = ?', [Number(id)])
  );
}

export async function getDashboardStats() {
  const total = await runDatabaseOperation((db) =>
    db.getFirstAsync('SELECT COUNT(*) AS count FROM plants')
  );
  return {
    totalPlants: total?.count ?? 0,
    waterDue: 0,
    fertilizerDue: 0,
    harvestReady: 0,
    reminders: 0,
  };
}
