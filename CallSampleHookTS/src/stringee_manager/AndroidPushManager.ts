import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, {EventType, type Event} from '@notifee/react-native';
import {AppState, NativeModules, Platform} from 'react-native';
import {ANSWER_ACTION_ID, REJECT_ACTION_ID} from '../const';
import {savePendingNotificationAction} from '../storage';
import CallNotificationService from './CallNotificationService';
import StringeeCallManager from './StringeeCallManager';
import StringeeClientManager from './StringeeClientManager';
import {isTerminalStringeePush, parseStringeePushData} from './PushPayload';

export {isTerminalStringeePush, parseStringeePushData};

interface FullScreenIntentModule {
  requestPermission(): Promise<boolean>;
}

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

  private configured = false;
  private foregroundUnsubscribe: (() => void) | null = null;
  private messageUnsubscribe: (() => void) | null = null;

  /**
   * Registers Firebase, Notifee, and foreground-service handlers once.
   *
   * This must run from the Android entry file so background events can be
   * delivered before any React view is mounted.
   */
  configure(): void {
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
  async bootstrap(): Promise<void> {
    const initialNotification = await notifee.getInitialNotification();
    if (initialNotification?.pressAction?.id) {
      await this.handleNotificationAction(
        initialNotification.pressAction.id,
        String(initialNotification.notification?.data?.callId || ''),
      );
    }
    await this.requestFullScreenIntentPermissionIfNeeded();
  }

  /**
   * Requests access to full-screen call intents when Android requires it.
   * @returns Current full-screen-intent capability.
   */
  async requestFullScreenIntentPermissionIfNeeded(): Promise<boolean> {
    if (Number(Platform.Version) < 34) {
      return true;
    }
    try {
      const module = NativeModules.FullScreenIntent as
        | FullScreenIntentModule
        | undefined;
      return module ? await module.requestPermission() : false;
    } catch (error) {
      console.log('Unable to request full-screen intent permission', error);
      return false;
    }
  }

  /**
   * Handles a Stringee Firebase payload in foreground or headless mode.
   * @param message Firebase remote message.
   * @param foreground Whether the React application is foregrounded.
   */
  async handleRemoteMessage(
    message: FirebaseMessagingTypes.RemoteMessage,
    foreground: boolean,
  ): Promise<void> {
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

  /** Keeps the headless runtime alive while Stringee reconnects and emits the call. */
  private async keepRuntimeUntilIncomingCall(callId: string): Promise<void> {
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

  /** Routes supported Notifee press events to their call action. */
  private async handleNotificationEvent(event: Event): Promise<void> {
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
      String(event.detail.notification?.data?.callId || ''),
    );
  }

  /** Persists and applies Answer or Reject for the matching call. */
  private async handleNotificationAction(
    actionId: string,
    callId: string,
  ): Promise<void> {
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
