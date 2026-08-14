import messaging from '@react-native-firebase/messaging';
import notifee, {EventType} from '@notifee/react-native';
import {AppState, NativeModules, Platform} from 'react-native';
import {ANSWER_ACTION_ID, REJECT_ACTION_ID} from '../const';
import {savePendingNotificationAction} from '../storage';
import CallNotificationService from './CallNotificationService';
import StringeeCallManager from './StringeeCallManager';
import StringeeClientManager from './StringeeClientManager';
import {isTerminalStringeePush, parseStringeePushData} from './PushPayload';

export {isTerminalStringeePush, parseStringeePushData};

/**
 * Coordinates the Android push-notification lifecycle for Stringee calls.
 *
 * This singleton registers Firebase Messaging and Notifee handlers exactly
 * once, translates notification actions into call-manager operations, and
 * restores the Stringee connection when a call arrives in the background or
 * after a cold start. Platform notification rendering is delegated to
 * {@link CallNotificationService}.
 */
class AndroidPushManager {
  /** Shared Android push coordinator. */
  static instance = new AndroidPushManager();

  configured = false;
  foregroundUnsubscribe = null;
  messageUnsubscribe = null;

  /**
   * Registers Firebase, Notifee, and foreground-service handlers once.
   *
   * This must run from the Android entry file so background events can be
   * delivered before any React view is mounted.
   */
  configure() {
    if (this.configured || Platform.OS !== 'android') {
      return;
    }
    this.configured = true;
    CallNotificationService.instance.registerForegroundService();
    messaging().setBackgroundMessageHandler(message =>
      this.handleRemoteMessage(message, false),
    );
    messaging().onTokenRefresh(token => {
      StringeeClientManager.instance.updatePushToken(token);
    });
    this.messageUnsubscribe = messaging().onMessage(message =>
      this.handleRemoteMessage(message, true),
    );
    notifee.onBackgroundEvent(event => this.handleNotificationEvent(event));
    this.foregroundUnsubscribe = notifee.onForegroundEvent(event => {
      this.handleNotificationEvent(event).catch(console.log);
    });
  }

  /** Replays a cold-start notification action and checks Android 14 permission. */
  async bootstrap() {
    const initialNotification = await notifee.getInitialNotification();
    if (initialNotification?.pressAction?.id) {
      await this.handleNotificationAction(
        initialNotification.pressAction.id,
        initialNotification.notification?.data?.callId || '',
      );
    }
    await this.requestFullScreenIntentPermissionIfNeeded();
  }

  /**
   * Requests access to full-screen call intents when Android requires it.
   * @returns {Promise<boolean>} Current full-screen-intent capability.
   */
  async requestFullScreenIntentPermissionIfNeeded() {
    if (Number(Platform.Version) < 34) {
      return true;
    }
    try {
      return await NativeModules.FullScreenIntent?.requestPermission();
    } catch (error) {
      console.log('Unable to request full-screen intent permission', error);
      return false;
    }
  }

  /**
   * Handles a Stringee Firebase payload in foreground or headless mode.
   * @param {object} message Firebase remote message.
   * @param {boolean} foreground Whether the React application is foregrounded.
   * @returns {Promise<void>}
   */
  async handleRemoteMessage(message, foreground) {
    const data = parseStringeePushData(message);
    if (!data) {
      return;
    }
    const callId = data.callId?.toString() || '';
    if (data.callStatus === 'started') {
      const from = data.from || {};
      if (!foreground && AppState.currentState !== 'active') {
        await CallNotificationService.instance.showIncomingCallNotification({
          callId,
          caller: from.alias || from.number || 'Unknown caller',
          isVideo:
            data.isVideoCall === true ||
            data.isVideoCall === 1 ||
            data.isVideoCall === '1' ||
            data.isVideoCall === 'true',
        });
      }
      await this.keepRuntimeUntilIncomingCall(callId);
      return;
    }
    if (isTerminalStringeePush(data)) {
      StringeeCallManager.instance.endCallSession(callId);
      await CallNotificationService.instance.cleanup(callId);
    }
  }

  /**
   * Keeps the headless runtime alive while Stringee reconnects and emits the call.
   * @param {string} callId Expected Stringee call identifier.
   * @returns {Promise<void>}
   */
  async keepRuntimeUntilIncomingCall(callId) {
    if (StringeeCallManager.instance.matchesCallId(callId)) {
      return;
    }
    const waiter = StringeeClientManager.instance.waitForIncomingCall(callId);
    const restored = await StringeeClientManager.instance.restoreConnection();
    if (!restored) {
      await CallNotificationService.instance.cancelIncomingCallNotification(
        callId,
      );
      return;
    }
    await waiter;
  }

  /**
   * Routes supported Notifee press events to their call action.
   * @param {object} event Notifee foreground or background event.
   * @returns {Promise<void>}
   */
  async handleNotificationEvent(event) {
    if (
      event.type !== EventType.ACTION_PRESS &&
      event.type !== EventType.PRESS
    ) {
      return;
    }
    const actionId = event.detail.pressAction?.id;
    if (actionId !== ANSWER_ACTION_ID && actionId !== REJECT_ACTION_ID) {
      return;
    }
    await this.handleNotificationAction(
      actionId,
      event.detail.notification?.data?.callId || '',
    );
  }

  /**
   * Persists and applies Answer or Reject for the matching call.
   * @param {string} actionId Notification action identifier.
   * @param {string} callId Stringee call identifier carried by the notification.
   * @returns {Promise<void>}
   */
  async handleNotificationAction(actionId, callId) {
    await savePendingNotificationAction(actionId, callId);
    const handled =
      await StringeeCallManager.instance.applyPendingNotificationAction(callId);
    await CallNotificationService.instance.cancelIncomingCallNotification(
      callId,
    );
    if (!handled) {
      await this.keepRuntimeUntilIncomingCall(callId);
    }
  }
}

export default AndroidPushManager;
