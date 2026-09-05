import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as any),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Schedule a deadline reminder
// Fires at 9am on each reminder day (e.g. 7, 3, 1 days before)
export async function scheduleDeadlineReminder({
  title,
  body,
  deadlineDate,
  reminderDaysBefore = [7, 3, 1],
}: {
  title: string;
  body: string;
  deadlineDate: string;
  reminderDaysBefore?: number[];
}) {
  const deadline = new Date(deadlineDate);

  for (const daysBefore of reminderDaysBefore) {
    const triggerDate = new Date(deadline);
    triggerDate.setDate(triggerDate.getDate() - daysBefore);
    triggerDate.setHours(9, 0, 0, 0); // 9am local

    // Skip if trigger is in the past
    if (triggerDate <= new Date()) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: `${body} — ${daysBefore} day${daysBefore === 1 ? '' : 's'} remaining`,
        data: { type: 'deadline', deadlineDate },
      },
      trigger: triggerDate as any,
    });
  }
}

// Post-exchange reminder: "Want to log what happened?"
export async function scheduleExchangeReminder(exchangeTime: Date) {
  // 15 minutes after the scheduled exchange
  const triggerDate = new Date(exchangeTime.getTime() + 15 * 60 * 1000);
  if (triggerDate <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Log your exchange',
      body: 'You just had a custody exchange. Tap to document what happened.',
      data: { type: 'exchange_reminder' },
    },
    trigger: triggerDate as any,
  });
}

// Documentation gap nudge
export async function scheduleDailyNudge() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily check-in',
      body: 'Anything to document today? Even routine days are worth logging.',
      data: { type: 'daily_nudge' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    } as any,
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
