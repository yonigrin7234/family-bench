import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Haptic feedback helpers per iOS HIG.
// Only fires on iOS (Android haptics are different and less standardized).

export function hapticLight() {
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function hapticMedium() {
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export function hapticSuccess() {
  if (Platform.OS === 'ios') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

export function hapticWarning() {
  if (Platform.OS === 'ios') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}

export function hapticError() {
  if (Platform.OS === 'ios') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

// Selection changed (filter chips, type selector)
export function hapticSelection() {
  if (Platform.OS === 'ios') {
    Haptics.selectionAsync();
  }
}
