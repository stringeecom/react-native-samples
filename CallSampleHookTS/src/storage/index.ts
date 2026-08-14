import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  KEY_ACCESS_TOKEN,
  KEY_INCOMING_NOTIFICATION_CALL_ID,
  KEY_PENDING_NOTIFICATION_ACTION,
  KEY_PUSH_REGISTERED,
  KEY_PUSH_TOKEN,
  PENDING_NOTIFICATION_ACTION_TTL,
} from '../const';

export interface PushRegistration {
  registered: boolean;
  token: string;
}

export const getPushRegistration = async (): Promise<PushRegistration> => {
  try {
    const [registeredValue, token] = await Promise.all([
      AsyncStorage.getItem(KEY_PUSH_REGISTERED),
      AsyncStorage.getItem(KEY_PUSH_TOKEN),
    ]);
    return {
      registered: registeredValue === 'true',
      token: token || '',
    };
  } catch (error) {
    console.log('Unable to read push registration', error);
    return {registered: false, token: ''};
  }
};

export const savePushRegistration = async (token: string): Promise<void> => {
  await Promise.all([
    AsyncStorage.setItem(KEY_PUSH_REGISTERED, 'true'),
    AsyncStorage.setItem(KEY_PUSH_TOKEN, token),
  ]);
};

export const clearPushRegistration = async (): Promise<void> => {
  await Promise.all([
    AsyncStorage.removeItem(KEY_PUSH_REGISTERED),
    AsyncStorage.removeItem(KEY_PUSH_TOKEN),
  ]);
};

export const saveAccessToken = (token: string): Promise<void> =>
  AsyncStorage.setItem(KEY_ACCESS_TOKEN, token);

export const getAccessToken = async (): Promise<string> =>
  (await AsyncStorage.getItem(KEY_ACCESS_TOKEN)) || '';

export const clearAccessToken = (): Promise<void> =>
  AsyncStorage.removeItem(KEY_ACCESS_TOKEN);

export const saveIncomingNotificationCallId = (callId: string): Promise<void> =>
  AsyncStorage.setItem(KEY_INCOMING_NOTIFICATION_CALL_ID, callId || '');

export const getIncomingNotificationCallId = async (): Promise<string> =>
  (await AsyncStorage.getItem(KEY_INCOMING_NOTIFICATION_CALL_ID)) || '';

export const clearIncomingNotificationCallId = (): Promise<void> =>
  AsyncStorage.removeItem(KEY_INCOMING_NOTIFICATION_CALL_ID);

export interface PendingNotificationAction {
  action: string;
  callId: string;
  createdAt: number;
}

export const savePendingNotificationAction = async (
  action: string,
  callId = '',
): Promise<void> => {
  await AsyncStorage.setItem(
    KEY_PENDING_NOTIFICATION_ACTION,
    JSON.stringify({action, callId, createdAt: Date.now()}),
  );
};

export const consumePendingNotificationAction = async (
  callId: string,
): Promise<PendingNotificationAction | null> => {
  const rawValue = await AsyncStorage.getItem(KEY_PENDING_NOTIFICATION_ACTION);
  if (!rawValue) {
    return null;
  }

  await AsyncStorage.removeItem(KEY_PENDING_NOTIFICATION_ACTION);
  try {
    const pending = JSON.parse(rawValue) as PendingNotificationAction;
    const expired =
      !pending.createdAt ||
      Date.now() - pending.createdAt > PENDING_NOTIFICATION_ACTION_TTL;
    const mismatched =
      Boolean(pending.callId) && Boolean(callId) && pending.callId !== callId;
    return expired || mismatched ? null : pending;
  } catch (error) {
    console.log('Unable to parse pending notification action', error);
    return null;
  }
};

export const clearPendingNotificationAction = (): Promise<void> =>
  AsyncStorage.removeItem(KEY_PENDING_NOTIFICATION_ACTION);
