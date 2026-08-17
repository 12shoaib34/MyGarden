import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { cloudinaryConfig } from "../config/cloudConfig";
import {
  getAllSettings,
  importFertilizerTaskStates,
  importNotes,
  importPlants,
  listAllFertilizerTaskStates,
  listNotes,
  listPlants,
  setSetting,
  updatePlantImageUri,
} from "../storage/database";
import { requireCloudUser } from "./cloudAuthService";
import { uploadImageToCloudinary } from "./cloudinaryService";
import { autoExportBackup } from "./localBackupService";
import { firestoreDb } from "./firebaseApp";

const CLOUD_SYNC_SCHEMA_VERSION = 1;
const CLOUD_LAST_SYNC_AT_KEY = "cloudLastSyncAt";
const BACKUP_FOLDER_KEY = "backupFolderUri";
const SNAPSHOT_SIZE_LIMIT = 850000;

export async function uploadLocalSnapshotToCloud({ uploadImages = true } = {}) {
  const user = requireCloudUser();
  const snapshot = await buildLocalSnapshot({ uploadImages });
  const estimatedBytes = getEstimatedJsonBytes(snapshot);
  if (estimatedBytes > SNAPSHOT_SIZE_LIMIT) {
    throw new Error("Cloud backup is too large for one Firestore document.");
  }

  await setDoc(getSnapshotDoc(user.uid), {
    ...snapshot,
    estimatedBytes,
    syncedAt: serverTimestamp(),
    syncedAtIso: new Date().toISOString(),
  });
  await setSetting(CLOUD_LAST_SYNC_AT_KEY, new Date().toISOString());
  return getSnapshotSummary(snapshot);
}

export async function restoreCloudSnapshotToLocal() {
  const user = requireCloudUser();
  const snapshotDoc = await getDoc(getSnapshotDoc(user.uid));
  if (!snapshotDoc.exists()) {
    return { ok: false, message: "No cloud backup found for this account." };
  }

  const snapshot = snapshotDoc.data() || {};
  const settings = snapshot.settings || {};
  for (const [key, value] of Object.entries(settings)) {
    if (key !== BACKUP_FOLDER_KEY) {
      await setSetting(key, String(value ?? ""));
    }
  }

  const plantResult = await importPlants(Array.isArray(snapshot.plants) ? snapshot.plants : []);
  const noteResult = await importNotes(Array.isArray(snapshot.notes) ? snapshot.notes : []);
  const fertilizerResult = await importFertilizerTaskStates(
    Array.isArray(snapshot.fertilizerTaskStates) ? snapshot.fertilizerTaskStates : []
  );

  await setSetting(CLOUD_LAST_SYNC_AT_KEY, new Date().toISOString());
  await autoExportBackup();

  return {
    ok: true,
    plants: plantResult,
    notes: noteResult,
    fertilizerTaskStates: fertilizerResult,
  };
}

export async function autoSyncCloudBackup() {
  try {
    await uploadLocalSnapshotToCloud({ uploadImages: false });
  } catch {
    // Cloud sync must not block local SQLite saves.
  }
}

async function buildLocalSnapshot({ uploadImages }) {
  const [rawPlants, settings, notes, fertilizerTaskStates] = await Promise.all([
    listPlants(),
    getAllSettings(),
    listNotes(),
    listAllFertilizerTaskStates(),
  ]);
  const plants = uploadImages ? await uploadPlantImages(rawPlants) : rawPlants;
  const syncedSettings = uploadImages ? await uploadSettingsImages(settings) : settings;

  return {
    app: "MyGarden",
    schemaVersion: CLOUD_SYNC_SCHEMA_VERSION,
    cloudinary: {
      cloudName: cloudinaryConfig.cloudName,
    },
    exportedAt: new Date().toISOString(),
    settings: syncedSettings,
    plants,
    notes,
    fertilizerTaskStates,
  };
}

async function uploadPlantImages(plants) {
  const syncedPlants = [];

  for (const plant of plants) {
    if (!plant.image_uri || String(plant.image_uri).startsWith("http")) {
      syncedPlants.push(plant);
      continue;
    }

    try {
      const upload = await uploadImageToCloudinary(plant.image_uri);
      const nextPlant = {
        ...plant,
        image_uri: upload.secureUrl || plant.image_uri,
        cloudinary_public_id: upload.publicId || null,
      };
      if (upload.secureUrl) {
        await updatePlantImageUri(plant.id, upload.secureUrl);
      }
      syncedPlants.push(nextPlant);
    } catch {
      syncedPlants.push(plant);
    }
  }

  return syncedPlants;
}

async function uploadSettingsImages(settings) {
  const nextSettings = { ...settings };
  const avatarUri = nextSettings.profileAvatarUri;
  if (!avatarUri || String(avatarUri).startsWith("http")) {
    return nextSettings;
  }

  try {
    const upload = await uploadImageToCloudinary(avatarUri);
    if (upload.secureUrl) {
      nextSettings.profileAvatarUri = upload.secureUrl;
      await setSetting("profileAvatarUri", upload.secureUrl);
    }
  } catch {
    // Keep the local URI in the snapshot if Cloudinary cannot read it.
  }

  return nextSettings;
}

function getSnapshotDoc(userId) {
  return doc(firestoreDb, "users", userId, "snapshots", "current");
}

function getEstimatedJsonBytes(value) {
  return new Blob([JSON.stringify(value)]).size;
}

function getSnapshotSummary(snapshot) {
  return {
    ok: true,
    plants: snapshot.plants.length,
    settings: Object.keys(snapshot.settings || {}).length,
    notes: snapshot.notes.length,
    fertilizerTaskStates: snapshot.fertilizerTaskStates.length,
  };
}
