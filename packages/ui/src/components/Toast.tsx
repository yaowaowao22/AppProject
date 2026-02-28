import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const TOAST_DURATION = 3000;
const ANIMATION_DURATION = 300;

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { colors, theme } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss(toast.id);
      });
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss, opacity, translateY]);

  const getBackgroundColor = (): string => {
    switch (toast.type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      default:
        return colors.info;
    }
  };

  const getIcon = (): string => {
    switch (toast.type) {
      case 'success':
        return 'OK';
      case 'error':
        return '!!';
      case 'warning':
        return '!';
      case 'info':
        return 'i';
      default:
        return 'i';
    }
  };

  const containerStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.md,
  };

  return (
    <Animated.View style={[containerStyle, { opacity, transform: [{ translateY }] }]}>
      <Text
        style={{
          color: '#FFFFFF',
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: theme.typography.fontSize.sm,
          marginRight: theme.spacing.sm,
          fontWeight: '700',
        }}
      >
        {getIcon()}
      </Text>
      <Text
        style={{
          color: '#FFFFFF',
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: theme.typography.fontSize.md,
          flex: 1,
        }}
        numberOfLines={2}
      >
        {toast.message}
      </Text>
      <TouchableOpacity
        onPress={() => onDismiss(toast.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.lg,
            marginLeft: theme.spacing.sm,
            opacity: 0.8,
          }}
        >
          x
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const idCounter = useRef(0);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = String(++idCounter.current);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
});
