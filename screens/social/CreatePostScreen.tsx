/**
 * Create Post Screen
 * Create a new post for the event feed
 */

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Button } from "../../components/ui";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Spacing,
} from "../../constants/theme";
import { uploadImage } from "../../services/storageService";
import { useAuthStore } from "../../stores/authStore";
import { useSocialStore } from "../../stores/socialStore";

const MAX_CONTENT_LENGTH = 500;

export const CreatePostScreen: React.FC = () => {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();

  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  const { user } = useAuthStore();
  const { createPost } = useSocialStore();

  /**
   * Pick an image from library
   */
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  /**
   * Take a photo with camera
   */
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take photos",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  /**
   * Remove selected image
   */
  const handleRemoveImage = () => {
    setImageUri(null);
  };

  /**
   * Create post
   */
  const handlePost = async () => {
    if (!content.trim() || !user) return;

    try {
      setPosting(true);

      let imageUrl: string | undefined;

      // Upload image if selected
      if (imageUri) {
        setUploading(true);
        const result = await uploadImage(
          imageUri,
          "posts",
          `${user.id}_${Date.now()}`,
        );
        imageUrl = result.url || undefined;
        setUploading(false);
      }

      const { error } = await createPost(
        user.id,
        eventId || null,
        content.trim(),
        imageUrl,
      );

      if (!error) {
        router.back();
      } else {
        Alert.alert("Error", "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Failed to create post");
    } finally {
      setPosting(false);
      setUploading(false);
    }
  };

  const isValid =
    content.trim().length > 0 && content.length <= MAX_CONTENT_LENGTH;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color={Colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.title}>New Post</Text>

        <Button
          title="Post"
          onPress={handlePost}
          disabled={!isValid || posting}
          loading={posting}
          size="small"
          style={styles.postButton}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* User Info */}
          <View style={styles.userInfo}>
            <Avatar source={user?.avatar_url} name={user?.name} size="medium" />
            <View style={styles.userText}>
              <Text style={styles.userName}>{user?.name}</Text>
              {user?.company && (
                <Text style={styles.userCompany}>{user.company}</Text>
              )}
            </View>
          </View>

          {/* Content Input */}
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={setContent}
            placeholder="What's happening at the event?"
            placeholderTextColor={Colors.text.tertiary}
            multiline
            maxLength={MAX_CONTENT_LENGTH}
            autoFocus
            textAlignVertical="top"
          />

          {/* Character Count */}
          <Text
            style={[
              styles.charCount,
              content.length > MAX_CONTENT_LENGTH * 0.9 &&
                styles.charCountWarning,
            ]}
          >
            {content.length}/{MAX_CONTENT_LENGTH}
          </Text>

          {/* Image Preview */}
          {imageUri && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={Colors.text.primary}
                />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <View style={styles.mediaButtons}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handlePickImage}
              disabled={uploading}
            >
              <Ionicons
                name="image-outline"
                size={24}
                color={Colors.primary.accent}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handleTakePhoto}
              disabled={uploading}
            >
              <Ionicons
                name="camera-outline"
                size={24}
                color={Colors.primary.accent}
              />
            </TouchableOpacity>
          </View>

          {uploading && (
            <Text style={styles.uploadingText}>Uploading image...</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  postButton: {
    minWidth: 70,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  userText: {
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  userCompany: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  input: {
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    minHeight: 120,
    lineHeight: 24,
  },
  charCount: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    textAlign: "right",
    marginTop: Spacing.sm,
  },
  charCountWarning: {
    color: Colors.status.warning,
  },
  imagePreviewContainer: {
    marginTop: Spacing.md,
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
  },
  removeImageButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: BorderRadius.full,
  },
  bottomActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    backgroundColor: Colors.background.secondary,
  },
  mediaButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  mediaButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadingText: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
  },
});

export default CreatePostScreen;
