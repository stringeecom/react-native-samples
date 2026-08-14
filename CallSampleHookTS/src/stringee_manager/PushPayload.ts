import type {FirebaseMessagingTypes} from '@react-native-firebase/messaging';

export interface StringeePushData {
  callStatus?: string;
  callId?: string | number;
  original?: boolean | string | number;
  isVideoCall?: boolean | string | number;
  from?: {alias?: string; number?: string};
}

export const parseStringeePushData = (
  message: FirebaseMessagingTypes.RemoteMessage,
): StringeePushData | null => {
  if (message.data?.stringeePushNotification !== '1.0') {
    return null;
  }
  const rawData: unknown = message.data.data;
  if (!rawData) {
    return null;
  }
  try {
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    return data && typeof data === 'object' ? (data as StringeePushData) : null;
  } catch (_) {
    return null;
  }
};

export const isTerminalStringeePush = (data: StringeePushData): boolean => {
  const isOriginal =
    data.original === true || data.original === 1 || data.original === 'true';
  return (
    data.callStatus === 'ended' ||
    data.callStatus === 'busy' ||
    data.callStatus === 'agentEnded' ||
    (data.callStatus === 'answered' && !isOriginal)
  );
};
