import * as FileSystem from "expo-file-system/legacy";
import { cloudinaryConfig } from "../config/cloudConfig";
import { getReadyCloudUser } from "./cloudAuthService";

export function isCloudImageUri(imageUri) {
  return String(imageUri || "").includes("res.cloudinary.com/");
}

export async function uploadImageForCloudIfSignedIn(imageUri) {
  if (!shouldUploadImage(imageUri)) {
    return imageUri || "";
  }

  const user = await getReadyCloudUser();
  if (!user) {
    return imageUri;
  }

  const result = await uploadImageToCloudinary(imageUri);
  return result.secureUrl || imageUri;
}

export async function uploadImageForCloudRequired(imageUri) {
  if (!shouldUploadImage(imageUri)) {
    return imageUri || "";
  }

  const user = await getReadyCloudUser();
  if (!user) {
    throw new Error("Sign in to cloud backup before saving a plant image.");
  }

  const result = await uploadImageToCloudinary(imageUri);
  if (!result.secureUrl) {
    throw new Error("Cloudinary did not return an image URL.");
  }

  return result.secureUrl;
}

export async function uploadImageToCloudinary(imageUri) {
  if (!shouldUploadImage(imageUri)) {
    return { secureUrl: imageUri || "", publicId: "" };
  }

  const fileName = createImageName(imageUri);
  const mimeType = getMimeType(fileName);
  const uploadFile = await createCloudinaryUploadFile(imageUri, mimeType);
  const formData = new FormData();
  formData.append("upload_preset", cloudinaryConfig.uploadPreset);
  formData.append("file", uploadFile);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Cloudinary upload failed.");
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
  };
}

function shouldUploadImage(imageUri) {
  const uri = String(imageUri || "");
  return Boolean(uri) && !uri.startsWith("http://") && !uri.startsWith("https://");
}

async function createCloudinaryUploadFile(imageUri, mimeType) {
  if (String(imageUri || "").startsWith("data:")) {
    return imageUri;
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    throw new Error(error?.message || "Could not read image for Cloudinary upload.");
  }
}

function createImageName(imageUri) {
  const extension = getImageExtension(imageUri);
  return `mygarden-${Date.now()}.${extension}`;
}

function getImageExtension(imageUri) {
  const cleanUri = String(imageUri || "").split("?")[0].toLowerCase();
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
