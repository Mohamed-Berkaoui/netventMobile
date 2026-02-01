/**
 * Input Component
 * Reusable text input with validation support
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Spacing,
} from "../../constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  required = false,
  secureTextEntry,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle password visibility toggle
  const isPassword = secureTextEntry !== undefined;
  const actualSecureEntry = isPassword ? !showPassword : false;

  const inputContainerStyles = [
    styles.inputContainer,
    isFocused && styles.inputContainerFocused,
    error && styles.inputContainerError,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View style={inputContainerStyles}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? Colors.primary.accent : Colors.text.tertiary}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || isPassword) && styles.inputWithRightIcon,
          ]}
          placeholderTextColor={Colors.text.tertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={actualSecureEntry}
          {...textInputProps}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIconButton}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={Colors.text.tertiary}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconButton}
            disabled={!onRightIconPress}
          >
            <Ionicons name={rightIcon} size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  required: {
    color: Colors.status.error,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.secondary,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: Colors.primary.accent,
  },
  inputContainerError: {
    borderColor: Colors.status.error,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  inputWithLeftIcon: {
    paddingLeft: Spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: Spacing.xs,
  },
  leftIcon: {
    marginLeft: Spacing.md,
  },
  rightIconButton: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  error: {
    fontSize: FontSizes.sm,
    color: Colors.status.error,
    marginTop: Spacing.xs,
  },
  hint: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
});

export default Input;
