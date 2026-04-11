import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { Check, AlertTriangle, X } from 'lucide-react-native';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

const toastConfig: Record<ToastType, { bg: string; icon: typeof Check }> = {
  success: { bg: 'bg-success', icon: Check },
  error: { bg: 'bg-danger', icon: X },
  warning: { bg: 'bg-warning', icon: AlertTriangle },
  info: { bg: 'bg-accent', icon: Check },
};

// One toast at a time, auto-dismiss (anti-pattern #15: no stacking)
export function Toast({ message, type = 'success', visible, onDismiss, duration = 3000 }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, duration, onDismiss, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      className={`absolute top-14 left-4 right-4 ${config.bg} rounded-card p-4 flex-row items-center gap-3 z-50`}
      style={{ transform: [{ translateY }] }}
    >
      <Icon size={20} strokeWidth={1.75} color="#FFFFFF" />
      <Text className="font-ui text-[14px] text-white flex-1">{message}</Text>
    </Animated.View>
  );
}
