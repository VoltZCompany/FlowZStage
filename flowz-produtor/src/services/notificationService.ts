import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Show } from '../types/show';
import { ShowReminder } from '../types/show';

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Padrão',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF453A',
  });
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Lembretes de shows',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF453A',
  });
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleTestNotification(seconds: number): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    setTimeout(() => {
      new Notification('🔔 Notificação de teste', {
        body: 'Sua notificação de teste chegou!',
        icon: '/favicon.png',
      });
    }, seconds * 1000);
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Notificação de teste',
      body: 'Sua notificação de teste chegou!',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}

export async function scheduleShowReminderNotif(
  show: Show,
  reminder: ShowReminder,
  notifyAt: Date,
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (notifyAt <= new Date()) return null;
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎤 ${show.name}`,
        body: reminder.text,
        sound: 'default',
        data: { showId: show.id, reminderId: reminder.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notifyAt,
      },
    });
    return id;
  } catch (e) {
    console.error('scheduleShowReminderNotif:', e);
    return null;
  }
}

export async function cancelShowReminderNotif(notificationId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    console.error('cancelShowReminderNotif:', e);
  }
}
