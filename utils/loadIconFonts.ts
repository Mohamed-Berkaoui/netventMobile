// This file ensures Ionicons fonts are loaded on web
import * as Ionicons from "@expo/vector-icons/Ionicons";
import { useFonts } from "expo-font";

export async function loadIconFonts() {
  try {
    await useFonts({
      ...Ionicons.default,
    });
  } catch (error) {
    console.warn("Failed to load icon fonts:", error);
  }
}
