import notifee, {
  AndroidCategory,
  AndroidImportance,
} from '@notifee/react-native';
import {
  ANSWER_ACTION_ID,
  CHANNEL_DESCRIPTION,
  CHANNEL_ID,
  CHANNEL_NAME,
  IN_CALL_CHANNEL_ID,
  IN_CALL_CHANNEL_NAME,
  IN_CALL_NOTIFICATION_ID,
  NOTIFICATION_ID,
  OPEN_APP_ACTION_ID,
  OPEN_APP_IN_FULL_SCREEN_MODE_ACTION_ID,
  REJECT_ACTION_ID,
} from '../const';
import {
  clearIncomingNotificationCallId,
  getIncomingNotificationCallId,
  saveIncomingNotificationCallId,
} from '../storage';

/**
 * Owns Android notifications that represent the current Stringee call.
 *
 * The service creates the incoming-call notification, promotes an answered or
 * outgoing call to a microphone foreground service, and performs call-ID-aware
 * cleanup so a late event cannot dismiss a newer call notification.
 */
class CallNotificationService {
  /** Shared notification service for the active Android call. */
  static instance = new CallNotificationService();

  foregroundServiceRegistered = false;
  foregroundServiceRunning = false;
  foregroundCallId = '';

  /** Registers Notifee's long-running microphone foreground-service callback. */
  registerForegroundService() {
    if (this.foregroundServiceRegistered) {
      return;
    }
    this.foregroundServiceRegistered = true;
    notifee.registerForegroundService(() => new Promise(() => {}));
  }

  /**
   * Displays the high-priority, full-screen incoming-call notification.
   * @param {{callId: string, caller?: string, isVideo?: boolean}} data Call metadata.
   * @returns {Promise<void>}
   */
  async showIncomingCallNotification({
    callId,
    caller = 'Unknown caller',
    isVideo = false,
  }) {
    const channelId = await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      description: CHANNEL_DESCRIPTION,
      vibration: true,
      importance: AndroidImportance.HIGH,
    });
    await saveIncomingNotificationCallId(callId);
    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: isVideo ? 'Incoming video call' : 'Incoming call',
      body: caller,
      data: {callId},
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.CALL,
        visibility: 1,
        autoCancel: false,
        ongoing: true,
        pressAction: {
          id: OPEN_APP_ACTION_ID,
          launchActivity: 'default',
        },
        actions: [
          {
            title: 'Answer',
            pressAction: {
              id: ANSWER_ACTION_ID,
              launchActivity: 'default',
            },
          },
          {
            title: 'Reject',
            pressAction: {id: REJECT_ACTION_ID},
          },
        ],
        fullScreenAction: {
          id: OPEN_APP_IN_FULL_SCREEN_MODE_ACTION_ID,
          launchActivity: 'default',
        },
      },
    });
  }

  /**
   * Cancels the incoming notification only when its call ID still matches.
   * @param {string} [callId=''] Expected call identifier.
   * @returns {Promise<void>}
   */
  async cancelIncomingCallNotification(callId = '') {
    const currentCallId = await getIncomingNotificationCallId();
    if (callId && currentCallId && callId !== currentCallId) {
      return;
    }
    await notifee.cancelNotification(NOTIFICATION_ID);
    await clearIncomingNotificationCallId();
  }

  /**
   * Starts the ongoing notification required for an active microphone call.
   * @param {object} call Active Stringee call.
   * @returns {Promise<void>}
   */
  async startInCallService(call) {
    this.registerForegroundService();
    const channelId = await notifee.createChannel({
      id: IN_CALL_CHANNEL_ID,
      name: IN_CALL_CHANNEL_NAME,
      importance: AndroidImportance.LOW,
    });
    this.foregroundServiceRunning = true;
    this.foregroundCallId = call.callId || '';
    await notifee.displayNotification({
      id: IN_CALL_NOTIFICATION_ID,
      title:
        call.fromAlias || call.toAlias || call.from || call.to || 'Stringee',
      body: 'Call in progress',
      data: {callId: call.callId || ''},
      android: {
        channelId,
        category: AndroidCategory.CALL,
        importance: AndroidImportance.LOW,
        ongoing: true,
        autoCancel: false,
        onlyAlertOnce: true,
        showChronometer: true,
        asForegroundService: true,
        pressAction: {
          id: OPEN_APP_ACTION_ID,
          launchActivity: 'default',
        },
      },
    });
  }

  /**
   * Stops the matching ongoing call notification and foreground service.
   * @param {string} [callId=''] Expected call identifier.
   * @returns {Promise<void>}
   */
  async stopInCallService(callId = '') {
    if (callId && this.foregroundCallId && callId !== this.foregroundCallId) {
      return;
    }
    if (this.foregroundServiceRunning) {
      await notifee.stopForegroundService();
      this.foregroundServiceRunning = false;
    }
    this.foregroundCallId = '';
    await notifee.cancelNotification(IN_CALL_NOTIFICATION_ID);
  }

  /**
   * Removes both incoming and in-call notifications for a call.
   * @param {string} [callId=''] Expected call identifier.
   * @returns {Promise<void>}
   */
  async cleanup(callId = '') {
    await Promise.all([
      this.cancelIncomingCallNotification(callId),
      this.stopInCallService(callId),
    ]);
  }
}

export default CallNotificationService;
