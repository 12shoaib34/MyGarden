import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AlertTriangle, CheckCircle2, HelpCircle, Info, Trash2, XCircle } from "lucide-react-native";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { withHaptic } from "../services/hapticService";
import { useTheme } from "../theme/ThemeProvider";

const AppDialogContext = createContext(null);

export function AppDialogProvider({ children }) {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();
  const themedStyles = createStyles(theme, insets);
  const resolverRef = useRef(null);
  const [dialog, setDialog] = useState(null);

  const closeDialog = useCallback((value) => {
    setDialog(null);
    resolverRef.current?.(value);
    resolverRef.current = null;
  }, []);

  const showDialog = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        type: "message",
        variant: options.variant || "info",
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel || "OK",
      });
    });
  }, []);

  const showConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        type: "confirm",
        variant: options.variant || (options.destructive ? "danger" : "confirm"),
        title: options.title,
        message: options.message,
        cancelLabel: options.cancelLabel || "Cancel",
        confirmLabel: options.confirmLabel || "Confirm",
        destructive: options.destructive === true,
      });
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      showDialog,
      showConfirm,
    }),
    [showConfirm, showDialog]
  );

  return (
    <AppDialogContext.Provider value={contextValue}>
      {children}
      <Modal
        visible={Boolean(dialog)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => closeDialog(false)}
      >
        {dialog ? (
          <View style={themedStyles.overlay}>
            <View style={themedStyles.dialog}>
              <View style={themedStyles.iconWrap}>
                <DialogIcon dialog={dialog} color={getIconColor(theme, dialog)} />
              </View>
              <Text style={themedStyles.title}>{dialog.title}</Text>
              {dialog.message ? (
                <Text style={themedStyles.message}>{dialog.message}</Text>
              ) : null}
              <View style={themedStyles.actions}>
                {dialog.type === "confirm" ? (
                  <Pressable
                    onPress={withHaptic(() => closeDialog(false), "tap")}
                    style={({ pressed }) => [
                      themedStyles.actionButton,
                      themedStyles.secondaryButton,
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <Text style={themedStyles.secondaryLabel}>{dialog.cancelLabel}</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={withHaptic(
                    () => closeDialog(dialog.type === "confirm" ? true : undefined),
                    dialog.destructive ? "reject" : "confirm"
                  )}
                  style={({ pressed }) => [
                    themedStyles.actionButton,
                    dialog.destructive ? themedStyles.dangerButton : themedStyles.primaryButton,
                    { opacity: pressed ? 0.82 : 1 },
                  ]}
                >
                  <Text
                    style={
                      dialog.destructive
                        ? themedStyles.dangerLabel
                        : themedStyles.primaryLabel
                    }
                  >
                    {dialog.confirmLabel}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </Modal>
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const context = useContext(AppDialogContext);
  if (!context) {
    throw new Error("useAppDialog must be used inside AppDialogProvider");
  }
  return context;
}

function DialogIcon({ dialog, color }) {
  const iconProps = { size: 30, color, strokeWidth: 2.2 };
  if (dialog.variant === "success") {
    return <CheckCircle2 {...iconProps} />;
  }
  if (dialog.variant === "danger") {
    return <Trash2 {...iconProps} />;
  }
  if (dialog.variant === "warning") {
    return <AlertTriangle {...iconProps} />;
  }
  if (dialog.variant === "error") {
    return <XCircle {...iconProps} />;
  }
  if (dialog.variant === "confirm") {
    return <HelpCircle {...iconProps} />;
  }
  return <Info {...iconProps} />;
}

function getIconColor(theme, dialog) {
  if (dialog.variant === "danger" || dialog.variant === "error") {
    return theme.colors.error;
  }
  if (dialog.variant === "warning") {
    return theme.colors.warning;
  }
  if (dialog.variant === "success") {
    return theme.colors.success;
  }
  return theme.colors.primary;
}

function createStyles(theme, insets) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingTop: Math.max(insets.top, 24),
      paddingBottom: Math.max(insets.bottom, 24),
      backgroundColor: "rgba(0, 0, 0, 0.58)",
    },
    dialog: {
      width: "100%",
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 20,
      gap: 12,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    title: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    message: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      paddingTop: 8,
    },
    actionButton: {
      minHeight: 48,
      minWidth: 108,
      borderRadius: theme.radius.full,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
      borderWidth: 1,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    secondaryButton: {
      backgroundColor: theme.colors.surfaceSoft,
      borderColor: theme.colors.border,
    },
    dangerButton: {
      backgroundColor: theme.colors.errorSurface,
      borderColor: theme.colors.error,
    },
    primaryLabel: {
      ...theme.typography.label,
      color: theme.colors.onPrimary,
    },
    secondaryLabel: {
      ...theme.typography.label,
      color: theme.colors.primary,
    },
    dangerLabel: {
      ...theme.typography.label,
      color: theme.colors.error,
    },
  });
}
