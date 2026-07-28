import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import type { PermissionState } from '@capacitor/core';
import type { ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import type {
  ActionPerformed as LocalNotificationActionPerformed,
  LocalNotificationSchema,
} from '@capacitor/local-notifications';

const STORAGE_KEY = 'sales-demo-push-registration';
const ANDROID_CHANNEL_ID = 'field-sales-alerts';
const ACTION_TYPE_ID = 'field-sales-actions';
const NOTIFICATION_GROUP = 'field-sales-demo';

export type MobileNotificationRegistration = {
  isNative: boolean;
  platform: string;
  permission: PermissionState | 'unsupported';
  localPermission?: PermissionState | 'unsupported';
  token?: string;
  registeredAt?: string;
  lastError?: string;
};

export type MobileNotificationRequest = {
  id: string;
  title: string;
  body: string;
  scheduleAt?: Date;
  route?: string;
  visitId?: string;
  accountId?: string;
  assistantNotificationId?: string;
  type?: string;
};

type ListenerOptions = {
  onForegroundNotification?: (notification: PushNotificationSchema | LocalNotificationSchema) => void;
  onNotificationAction?: (notification: ActionPerformed | LocalNotificationActionPerformed, targetRoute?: string) => void;
};

const registrationListeners = new Set<(state: MobileNotificationRegistration) => void>();
let nativeListenersReady = false;
let localNotificationsReady = false;

const baseRegistration = (): MobileNotificationRegistration => ({
  isNative: Capacitor.isNativePlatform(),
  platform: Capacitor.getPlatform(),
  permission: Capacitor.isNativePlatform() ? 'prompt' : 'unsupported',
  localPermission: Capacitor.isNativePlatform() ? 'prompt' : 'unsupported',
});

const readStoredRegistration = (): MobileNotificationRegistration | undefined => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as MobileNotificationRegistration) : undefined;
  } catch {
    return undefined;
  }
};

const saveRegistration = (patch: Partial<MobileNotificationRegistration>) => {
  const next = {
    ...baseRegistration(),
    ...readStoredRegistration(),
    ...patch,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  registrationListeners.forEach((listener) => listener(next));
  return next;
};

export const getMobileNotificationRegistration = () => ({
  ...baseRegistration(),
  ...readStoredRegistration(),
});

export const subscribeMobileNotificationRegistration = (listener: (state: MobileNotificationRegistration) => void) => {
  registrationListeners.add(listener);
  return () => registrationListeners.delete(listener);
};

const notificationIdFromString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.max(1, Math.abs(hash));
};

const ensureLocalNotificationsReady = async (shouldRequestPermission = true) => {
  if (!Capacitor.isNativePlatform()) {
    saveRegistration({
      localPermission: 'unsupported',
      lastError: 'Mobile notifications are available only in the installed Capacitor app.',
    });
    return false;
  }

  let permissions = await LocalNotifications.checkPermissions();
  if (permissions.display === 'prompt' && shouldRequestPermission) {
    permissions = await LocalNotifications.requestPermissions();
  }

  saveRegistration({
    localPermission: permissions.display,
    lastError: permissions.display === 'granted' ? undefined : 'Local notification permission was not granted.',
  });

  if (permissions.display !== 'granted') return false;

  if (!localNotificationsReady) {
    await LocalNotifications.registerActionTypes({
      types: [{
        id: ACTION_TYPE_ID,
        actions: [
          { id: 'open', title: 'Open', foreground: true },
        ],
      }],
    });

    if (Capacitor.getPlatform() === 'android') {
      await LocalNotifications.createChannel({
        id: ANDROID_CHANNEL_ID,
        name: 'Field sales alerts',
        description: 'Visit reminders, arrival alerts and CRM follow-up notifications.',
        importance: 4,
        visibility: 1,
        lights: true,
        lightColor: '#38BDF8',
        vibration: true,
      });
    }

    localNotificationsReady = true;
  }

  return true;
};

export const setupMobileNotificationListeners = async (options: ListenerOptions = {}) => {
  if (!Capacitor.isNativePlatform() || nativeListenersReady) return getMobileNotificationRegistration();

  await PushNotifications.addListener('registration', (token) => {
    saveRegistration({
      permission: 'granted',
      token: token.value,
      registeredAt: new Date().toISOString(),
      lastError: undefined,
    });
  });

  await PushNotifications.addListener('registrationError', (error) => {
    saveRegistration({ lastError: error.error });
  });

  await PushNotifications.addListener('pushNotificationReceived', (notification) => {
    options.onForegroundNotification?.(notification);
  });

  await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    const data = notification.notification.data as { route?: string; href?: string } | undefined;
    options.onNotificationAction?.(notification, data?.route ?? data?.href);
  });

  await LocalNotifications.addListener('localNotificationReceived', (notification) => {
    options.onForegroundNotification?.(notification);
  });

  await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
    const data = notification.notification.extra as { route?: string; href?: string } | undefined;
    options.onNotificationAction?.(notification, data?.route ?? data?.href);
  });

  nativeListenersReady = true;
  return getMobileNotificationRegistration();
};

export const registerForMobileNotifications = async () => {
  if (!Capacitor.isNativePlatform()) {
    return saveRegistration({
      isNative: false,
      platform: 'web',
      permission: 'unsupported',
      lastError: 'Mobile notifications are available only in the installed Capacitor app.',
    });
  }

  await setupMobileNotificationListeners();
  await ensureLocalNotificationsReady();

  let permissions = await PushNotifications.checkPermissions();
  if (permissions.receive === 'prompt') {
    permissions = await PushNotifications.requestPermissions();
  }

  saveRegistration({
    permission: permissions.receive,
    lastError: permissions.receive === 'granted' ? undefined : 'Notification permission was not granted.',
  });

  if (permissions.receive !== 'granted') {
    return getMobileNotificationRegistration();
  }

  if (Capacitor.getPlatform() === 'android') {
    await PushNotifications.createChannel({
      id: ANDROID_CHANNEL_ID,
      name: 'Field sales alerts',
      description: 'Visit reminders, arrival alerts and CRM follow-up notifications.',
      importance: 4,
      visibility: 1,
      lights: true,
      lightColor: '#008A9A',
      vibration: true,
    });
  }

  await PushNotifications.register();
  return getMobileNotificationRegistration();
};

export const sendMobileNotification = async (notification: MobileNotificationRequest) => {
  if (!Capacitor.isNativePlatform()) return false;
  const isReady = await ensureLocalNotificationsReady();
  if (!isReady) return false;

  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: notificationIdFromString(notification.id),
        title: notification.title,
        body: notification.body,
        largeBody: notification.body,
        schedule: notification.scheduleAt
          ? {
            at: notification.scheduleAt,
            allowWhileIdle: true,
          }
          : undefined,
        channelId: ANDROID_CHANNEL_ID,
        actionTypeId: ACTION_TYPE_ID,
        group: NOTIFICATION_GROUP,
        autoCancel: true,
        interruptionLevel: 'timeSensitive',
        extra: {
          route: notification.route,
          href: notification.route,
          visitId: notification.visitId,
          accountId: notification.accountId,
          assistantNotificationId: notification.assistantNotificationId,
          type: notification.type,
        },
      }],
    });
    saveRegistration({ lastError: undefined });
    return true;
  } catch (error) {
    saveRegistration({
      lastError: error instanceof Error ? error.message : 'Local notification could not be scheduled.',
    });
    return false;
  }
};

export const cancelMobileNotifications = async (notificationIds: string[]) => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    await LocalNotifications.cancel({
      notifications: notificationIds.map((id) => ({ id: notificationIdFromString(id) })),
    });
    saveRegistration({ lastError: undefined });
    return true;
  } catch (error) {
    saveRegistration({
      lastError: error instanceof Error ? error.message : 'Local notifications could not be cancelled.',
    });
    return false;
  }
};
