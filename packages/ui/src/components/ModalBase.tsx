import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export interface ModalBaseProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function ModalBase({
  visible,
  onClose,
  children,
  title,
}: ModalBaseProps) {
  const { colors, theme } = useTheme();

  const contentStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    ...theme.shadows.lg,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={contentStyle}>
              {title ? (
                <View
                  style={[
                    styles.header,
                    {
                      marginBottom: theme.spacing.md,
                      paddingBottom: theme.spacing.sm,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.divider,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: theme.typography.fontFamily.medium,
                      fontSize: theme.typography.fontSize.xl,
                      fontWeight: '600',
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: theme.typography.fontSize.xxl,
                        lineHeight: theme.typography.fontSize.xxl,
                      }}
                    >
                      x
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
