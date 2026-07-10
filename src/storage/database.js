import * as SQLite from 'expo-sqlite';

let database;

export async function getDatabase() {
  if (!database) {
    database = await SQLite.openDatabaseAsync('organic_garden.db');
    await migrate(database);
  }
  return database;
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
}

export async function getSetting(key, fallback) {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? fallback;
}

export async function setSetting(key, value) {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    key,
    value
  );
}

export async function createPlant(plant) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO plants
      (name, variety, category, purchase_date, health_status, image_uri, notes, water_every_days, fertilizer_every_days, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    plant.name.trim(),
    plant.variety.trim(),
    plant.category,
    plant.purchaseDate,
    plant.healthStatus,
    plant.imageUri || null,
    plant.notes.trim(),
    Number(plant.waterEveryDays) || 2,
    Number(plant.fertilizerEveryDays) || 15,
    now
  );
  return result.lastInsertRowId;
}

export async function listPlants() {
  const db = await getDatabase();
  return db.getAllAsync('SELECT * FROM plants ORDER BY created_at DESC');
}

export async function getPlant(id) {
  const db = await getDatabase();
  return db.getFirstAsync('SELECT * FROM plants WHERE id = ?', Number(id));
}

export async function getDashboardStats() {
  const db = await getDatabase();
  const total = await db.getFirstAsync('SELECT COUNT(*) AS count FROM plants');
  return {
    totalPlants: total?.count ?? 0,
    waterDue: 0,
    fertilizerDue: 0,
    harvestReady: 0,
    reminders: 0,
  };
}
