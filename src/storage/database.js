import * as SQLite from 'expo-sqlite';
import { FALLBACK_PLANT_CATEGORY } from '../constants/plantCategories';

let database;
let databasePromise;

export const FERTILIZER_CARD_CHECK_ENABLED_KEY = 'fertilizerCardCheckEnabled';

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
      fertilizer_applied_at TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      reminder_hours INTEGER NOT NULL DEFAULT 0,
      reminder_minutes INTEGER NOT NULL DEFAULT 0,
      reminder_at TEXT NOT NULL,
      notification_identifier TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS fertilizer_task_states (
      month_key TEXT NOT NULL,
      task_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      notification_identifier TEXT,
      completed_at TEXT,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (month_key, task_id)
    );
  `);
  await ensureColumn(db, 'plants', 'is_favorite', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'plants', 'fertilizer_applied_at', 'TEXT');
}

async function ensureColumn(db, tableName, columnName, definition) {
  const columns = await db.getAllAsync(`PRAGMA table_info(${tableName})`);
  if (!columns.some((column) => column.name === columnName)) {
    await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
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

export async function updatePlantImageUri(id, imageUri) {
  await runDatabaseOperation((db) =>
    db.runAsync(
      'UPDATE plants SET image_uri = ? WHERE id = ?',
      [imageUri || null, Number(id)]
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
          (name, variety, category, purchase_date, health_status, image_uri, notes, water_every_days, fertilizer_every_days, fertilizer_applied_at, is_favorite, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          normalizedPlant.fertilizer_applied_at,
          normalizedPlant.is_favorite,
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
    category: plant.category || FALLBACK_PLANT_CATEGORY,
    purchase_date: plant.purchase_date || plant.purchaseDate || now.slice(0, 10),
    health_status: plant.health_status || plant.healthStatus || 'Healthy',
    image_uri: plant.image_uri || plant.imageUri || null,
    notes: String(plant.notes || '').trim(),
    water_every_days: Number(plant.water_every_days || plant.waterEveryDays) || 2,
    fertilizer_every_days: Number(plant.fertilizer_every_days || plant.fertilizerEveryDays) || 15,
    fertilizer_applied_at: plant.fertilizer_applied_at || plant.fertilizerAppliedAt || null,
    is_favorite: plant.is_favorite || plant.isFavorite ? 1 : 0,
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

export async function listLatestPlants(limit = 5) {
  return runDatabaseOperation((db) =>
    db.getAllAsync(
      'SELECT * FROM plants ORDER BY id DESC LIMIT ?',
      [Number(limit) || 5]
    )
  );
}

export async function listFavoritePlants(limit = 5) {
  return runDatabaseOperation((db) =>
    db.getAllAsync(
      'SELECT * FROM plants WHERE is_favorite = 1 ORDER BY name COLLATE NOCASE ASC, created_at DESC LIMIT ?',
      [Number(limit) || 5]
    )
  );
}

export async function setPlantFavorite(id, isFavorite) {
  await runDatabaseOperation((db) =>
    db.runAsync(
      'UPDATE plants SET is_favorite = ? WHERE id = ?',
      [isFavorite ? 1 : 0, Number(id)]
    )
  );
}

export async function setPlantFertilizerAppliedAt(id, appliedAt) {
  await runDatabaseOperation((db) =>
    db.runAsync(
      'UPDATE plants SET fertilizer_applied_at = ? WHERE id = ?',
      [appliedAt || null, Number(id)]
    )
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

export async function createNote(note) {
  const now = new Date().toISOString();
  const result = await runDatabaseOperation((db) =>
    db.runAsync(
      `INSERT INTO notes
        (title, description, reminder_hours, reminder_minutes, reminder_at, notification_identifier, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        note.title.trim(),
        String(note.description || '').trim(),
        Number(note.reminderHours) || 0,
        Number(note.reminderMinutes) || 0,
        note.reminderAt,
        note.notificationIdentifier || null,
        now,
      ]
    )
  );
  return result.lastInsertRowId;
}

export async function updateNoteNotificationIdentifier(id, notificationIdentifier) {
  await runDatabaseOperation((db) =>
    db.runAsync(
      'UPDATE notes SET notification_identifier = ? WHERE id = ?',
      [notificationIdentifier || null, Number(id)]
    )
  );
}

export async function listNotes() {
  return runDatabaseOperation((db) =>
    db.getAllAsync('SELECT * FROM notes ORDER BY created_at DESC, id DESC')
  );
}

export async function importNotes(notes = []) {
  const result = {
    total: notes.length,
    inserted: 0,
    skipped: 0,
  };

  await runDatabaseOperation((db) => db.withTransactionAsync(async () => {
    const existingRows = await db.getAllAsync('SELECT * FROM notes');
    const existingKeys = new Set(existingRows.map(getNoteImportKey));

    for (const note of notes) {
      const normalizedNote = normalizeImportedNote(note);
      if (!normalizedNote.title) {
        result.skipped += 1;
        continue;
      }

      const importKey = getNoteImportKey(normalizedNote);
      if (existingKeys.has(importKey)) {
        result.skipped += 1;
        continue;
      }

      await db.runAsync(
        `INSERT INTO notes
          (title, description, reminder_hours, reminder_minutes, reminder_at, notification_identifier, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          normalizedNote.title,
          normalizedNote.description,
          normalizedNote.reminder_hours,
          normalizedNote.reminder_minutes,
          normalizedNote.reminder_at,
          normalizedNote.notification_identifier,
          normalizedNote.created_at,
        ]
      );
      existingKeys.add(importKey);
      result.inserted += 1;
    }
  }));

  return result;
}

export async function listLatestNotes(limit = 3) {
  return runDatabaseOperation((db) =>
    db.getAllAsync(
      'SELECT * FROM notes ORDER BY created_at DESC, id DESC LIMIT ?',
      [Number(limit) || 3]
    )
  );
}

export async function deleteNote(id) {
  await runDatabaseOperation((db) =>
    db.runAsync('DELETE FROM notes WHERE id = ?', [Number(id)])
  );
}

export async function listFertilizerTaskStates(monthKey) {
  return runDatabaseOperation((db) =>
    db.getAllAsync(
      'SELECT * FROM fertilizer_task_states WHERE month_key = ?',
      [monthKey]
    )
  );
}

export async function listAllFertilizerTaskStates() {
  return runDatabaseOperation((db) =>
    db.getAllAsync(
      'SELECT * FROM fertilizer_task_states ORDER BY month_key DESC, task_id ASC'
    )
  );
}

export async function importFertilizerTaskStates(taskStates = []) {
  const result = {
    total: taskStates.length,
    upserted: 0,
    skipped: 0,
  };

  await runDatabaseOperation((db) => db.withTransactionAsync(async () => {
    for (const taskState of taskStates) {
      const normalizedTaskState = normalizeImportedFertilizerTaskState(taskState);
      if (!normalizedTaskState.month_key || !normalizedTaskState.task_id) {
        result.skipped += 1;
        continue;
      }

      await db.runAsync(
        `INSERT OR REPLACE INTO fertilizer_task_states
          (month_key, task_id, status, notes, notification_identifier, completed_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          normalizedTaskState.month_key,
          normalizedTaskState.task_id,
          normalizedTaskState.status,
          normalizedTaskState.notes,
          normalizedTaskState.notification_identifier,
          normalizedTaskState.completed_at,
          normalizedTaskState.updated_at,
        ]
      );
      result.upserted += 1;
    }
  }));

  return result;
}

export async function upsertFertilizerTaskState(monthKey, taskId, changes = {}) {
  const now = new Date().toISOString();
  const existing = await runDatabaseOperation((db) =>
    db.getFirstAsync(
      'SELECT * FROM fertilizer_task_states WHERE month_key = ? AND task_id = ?',
      [monthKey, taskId]
    )
  );
  const nextStatus = changes.status ?? existing?.status ?? 'pending';
  const nextNotes = changes.notes ?? existing?.notes ?? '';
  const hasNotificationIdentifierChange = Object.prototype.hasOwnProperty.call(
    changes,
    'notificationIdentifier'
  );
  const nextNotificationIdentifier = hasNotificationIdentifierChange
    ? changes.notificationIdentifier
    : existing?.notification_identifier ?? null;
  const nextCompletedAt =
    changes.completedAt ??
    (nextStatus === 'completed' || nextStatus === 'skipped'
      ? existing?.completed_at ?? now
      : null);

  await runDatabaseOperation((db) =>
    db.runAsync(
      `INSERT OR REPLACE INTO fertilizer_task_states
        (month_key, task_id, status, notes, notification_identifier, completed_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        monthKey,
        taskId,
        nextStatus,
        nextNotes,
        nextNotificationIdentifier,
        nextCompletedAt,
        now,
      ]
    )
  );
}

export async function updateFertilizerTaskNotificationIdentifier(
  monthKey,
  taskId,
  notificationIdentifier
) {
  await upsertFertilizerTaskState(monthKey, taskId, { notificationIdentifier });
}

export async function listFertilizerHistory(limit = 6) {
  return runDatabaseOperation((db) =>
    db.getAllAsync(
      `SELECT
        month_key,
        COUNT(*) AS touched_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) AS skipped_count,
        MAX(updated_at) AS updated_at
      FROM fertilizer_task_states
      GROUP BY month_key
      ORDER BY month_key DESC
      LIMIT ?`,
      [Number(limit) || 6]
    )
  );
}

function normalizeImportedNote(note = {}) {
  const now = new Date().toISOString();
  return {
    title: String(note.title || '').trim(),
    description: String(note.description || '').trim(),
    reminder_hours: Number(note.reminder_hours || note.reminderHours) || 0,
    reminder_minutes: Number(note.reminder_minutes || note.reminderMinutes) || 0,
    reminder_at: note.reminder_at || note.reminderAt || now,
    notification_identifier: note.notification_identifier || note.notificationIdentifier || null,
    created_at: note.created_at || now,
  };
}

function getNoteImportKey(note) {
  return [
    note.title,
    note.description,
    note.reminder_hours,
    note.reminder_minutes,
    note.reminder_at,
    note.created_at,
  ].map((value) => String(value ?? '')).join('\u001f');
}

function normalizeImportedFertilizerTaskState(taskState = {}) {
  const now = new Date().toISOString();
  return {
    month_key: String(taskState.month_key || taskState.monthKey || '').trim(),
    task_id: String(taskState.task_id || taskState.taskId || '').trim(),
    status: taskState.status || 'pending',
    notes: String(taskState.notes || '').trim(),
    notification_identifier:
      taskState.notification_identifier || taskState.notificationIdentifier || null,
    completed_at: taskState.completed_at || taskState.completedAt || null,
    updated_at: taskState.updated_at || taskState.updatedAt || now,
  };
}
