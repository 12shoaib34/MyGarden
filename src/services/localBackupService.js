import * as FileSystem from "expo-file-system/legacy";
import { getAllSettings, getSetting, importPlants, listPlants, setSetting } from "../storage/database";

const BACKUP_FILE_NAME = "mygarden-backup.json";
const BACKUP_IMAGES_FOLDER_NAME = "mygarden-images";
const BACKUP_FOLDER_KEY = "backupFolderUri";

export async function getBackupFolderUri() {
  return getSetting(BACKUP_FOLDER_KEY, "");
}

export async function chooseBackupFolder() {
  const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) {
    return "";
  }
  await setSetting(BACKUP_FOLDER_KEY, permission.directoryUri);
  const existingBackup = await findBackupFile(permission.directoryUri);
  if (!existingBackup) {
    await exportBackup(permission.directoryUri);
    return { uri: permission.directoryUri, existingBackup: false };
  }
  return { uri: permission.directoryUri, existingBackup: true };
}

export async function exportBackup(folderUri, options = {}) {
  const targetFolderUri = folderUri || (await getBackupFolderUri());
  if (!targetFolderUri) {
    return { ok: false, message: "Choose a backup folder first." };
  }

  const plants = await listPlants();
  const settings = await getAllSettings();
  const existingBackup = await readBackupPayload(targetFolderUri);
  const existingPlantCount = existingBackup?.plants?.length ?? 0;
  const force = options.force === true;

  if (!force && plants.length === 0 && existingPlantCount > 0) {
    return {
      ok: false,
      protected: true,
      message: `Existing backup has ${existingPlantCount} plants. Import it before creating a new empty backup.`,
    };
  }

  const payload = {
    app: "MyGarden",
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    plants,
  };
  const content = JSON.stringify(payload, null, 2);

  const existingFileUri = await findBackupFile(targetFolderUri);
  if (existingFileUri) {
    await FileSystem.StorageAccessFramework.deleteAsync(existingFileUri, { idempotent: true });
  }
  const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
    targetFolderUri,
    BACKUP_FILE_NAME,
    "application/json"
  );
  await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return { ok: true, count: plants.length };
}

export async function autoExportBackup() {
  const folderUri = await getBackupFolderUri();
  if (!folderUri) {
    return;
  }

  try {
    await exportBackup(folderUri);
  } catch {
    // Backup should not block normal plant saving.
  }
}

export async function backupImageIfEnabled(imageUri) {
  if (!imageUri || imageUri.startsWith("content://")) {
    return imageUri || "";
  }

  const folderUri = await getBackupFolderUri();
  if (!folderUri) {
    return imageUri;
  }

  try {
    const imagesFolderUri = await getOrCreateImagesFolder(folderUri);
    const imageName = createImageName(imageUri);
    const imageFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      imagesFolderUri,
      imageName,
      getMimeType(imageName)
    );
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await FileSystem.writeAsStringAsync(imageFileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return imageFileUri;
  } catch {
    return imageUri;
  }
}

export async function importLatestBackup() {
  const folderUri = await getBackupFolderUri();
  if (!folderUri) {
    return { ok: false, message: "Choose the backup folder again, then import." };
  }

  const backupFile = await findBackupFile(folderUri);
  if (!backupFile) {
    return { ok: false, message: "No mygarden-backup.json file found in this folder." };
  }

  const content = await FileSystem.readAsStringAsync(backupFile, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const payload = JSON.parse(content);
  if (payload.settings && typeof payload.settings === "object") {
    for (const [key, value] of Object.entries(payload.settings)) {
      if (key !== BACKUP_FOLDER_KEY) {
        await setSetting(key, String(value));
      }
    }
  }
  const plants = Array.isArray(payload.plants) ? payload.plants : [];
  await importPlants(plants);
  return { ok: true, count: plants.length };
}

async function findBackupFile(folderUri) {
  const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(folderUri);
  return files.find((uri) => decodeURIComponent(uri).endsWith(BACKUP_FILE_NAME));
}

async function readBackupPayload(folderUri) {
  try {
    const backupFile = await findBackupFile(folderUri);
    if (!backupFile) {
      return null;
    }
    const content = await FileSystem.StorageAccessFramework.readAsStringAsync(backupFile, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function getOrCreateImagesFolder(folderUri) {
  const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(folderUri);
  const existing = files.find((uri) => decodeURIComponent(uri).endsWith(BACKUP_IMAGES_FOLDER_NAME));
  if (existing) {
    return existing;
  }
  return FileSystem.StorageAccessFramework.makeDirectoryAsync(
    folderUri,
    BACKUP_IMAGES_FOLDER_NAME
  );
}

function createImageName(imageUri) {
  const extension = getImageExtension(imageUri);
  return `plant-${Date.now()}.${extension}`;
}

function getImageExtension(imageUri) {
  const cleanUri = imageUri.split("?")[0].toLowerCase();
  const match = cleanUri.match(/\.([a-z0-9]+)$/);
  const extension = match?.[1];
  if (["jpg", "jpeg", "png", "webp"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }
  return "jpg";
}

function getMimeType(fileName) {
  if (fileName.endsWith(".png")) {
    return "image/png";
  }
  if (fileName.endsWith(".webp")) {
    return "image/webp";
  }
  return "image/jpeg";
}
