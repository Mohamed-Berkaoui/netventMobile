/**
 * Storage Service
 * Handles file uploads to Supabase Storage
 */

import * as ImagePicker from "expo-image-picker";
import { STORAGE_BUCKETS, supabase } from "./supabase";

interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Pick an image from the device library
 */
export const pickImage = async (): Promise<string | null> => {
  try {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      console.error("Media library permission denied");
      return null;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error: any) {
    console.error("Pick image error:", error);
    return null;
  }
};

/**
 * Take a photo with the camera
 */
export const takePhoto = async (): Promise<string | null> => {
  try {
    // Request permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      console.error("Camera permission denied");
      return null;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error: any) {
    console.error("Take photo error:", error);
    return null;
  }
};

/**
 * Upload an image to Supabase Storage
 */
export const uploadImage = async (
  uri: string,
  bucket: string,
  path: string,
): Promise<UploadResult> => {
  try {
    // Get file extension
    const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${path}.${ext}`;
    const contentType = `image/${ext === "jpg" ? "jpeg" : ext}`;

    // Read file as blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Convert blob to ArrayBuffer for upload
    const arrayBuffer = await new Response(blob).arrayBuffer();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType,
        upsert: true,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      error: null,
    };
  } catch (error: any) {
    console.error("Upload image error:", error);
    return {
      url: null,
      error: error.message,
    };
  }
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (
  userId: string,
  imageUri: string,
): Promise<UploadResult> => {
  const path = `${userId}/avatar-${Date.now()}`;
  return uploadImage(imageUri, STORAGE_BUCKETS.AVATARS, path);
};

/**
 * Upload post image
 */
export const uploadPostImage = async (
  userId: string,
  postId: string,
  imageUri: string,
): Promise<UploadResult> => {
  const path = `${userId}/${postId}-${Date.now()}`;
  return uploadImage(imageUri, STORAGE_BUCKETS.POST_IMAGES, path);
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (
  bucket: string,
  path: string,
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error("Delete file error:", error);
    return { error: error.message };
  }
};

export const StorageService = {
  pickImage,
  takePhoto,
  uploadImage,
  uploadAvatar,
  uploadPostImage,
  deleteFile,
};

export default StorageService;
