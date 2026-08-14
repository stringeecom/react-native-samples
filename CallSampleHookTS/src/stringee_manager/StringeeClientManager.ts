import {
  StringeeCall,
  StringeeCall2,
  StringeeClient,
  StringeeClientListener,
} from 'stringee-react-native-v2';
import messaging from '@react-native-firebase/messaging';
import StringeeCallManager from './StringeeCallManager';
import {isIos} from '../const';
import {
  clearAccessToken,
  clearPushRegistration,
  getAccessToken,
  getPushRegistration,
  saveAccessToken,
  savePushRegistration,
} from '../storage';
import type {ActiveCall} from '../types';

interface IncomingCallWaiter {
  callId: string;
  resolve: (value: boolean) => void;
  timeoutId: ReturnType<typeof setTimeout> | null;
}

/**
 * Owns the shared Stringee client and its connection/push-registration state.
 *
 * The manager persists access tokens for background reconnection, serializes
 * push registration, forwards SDK callbacks to the active UI listener, and
 * lets headless notification handlers wait briefly for the matching incoming
 * call object before processing Answer or Reject.
 */
class StringeeClientManager {
  /** Shared client manager used by UI and headless push handlers. */
  static instance = new StringeeClientManager();

  client: StringeeClient = new StringeeClient();
  listener: StringeeClientListener | null = null;
  pushToken = '';
  isConnected = false;
  isConnecting = false;
  pendingPushRegistration: Promise<void> | null = null;
  incomingCallWaiters = new Set<IncomingCallWaiter>();

  /** Creates the SDK client and installs its permanent forwarding listener. */
  constructor() {
    this.setListener();
  }

  /** Stores a new platform push token and registers it when already connected. */
  updatePushToken(token: string): void {
    if (!token) {
      return;
    }
    this.pushToken = token;
    if (this.client.isConnected) {
      this.registerTokenToStringee().catch(console.log);
    }
  }

  /** Returns the current platform-specific push token. */
  async resolvePushToken(): Promise<string> {
    return isIos ? this.pushToken : messaging().getToken();
  }

  /** Returns the shared in-flight Stringee registration operation. */
  registerTokenToStringee(): Promise<void> {
    if (this.pendingPushRegistration) {
      return this.pendingPushRegistration;
    }
    this.pendingPushRegistration = this.performPushRegistration().finally(
      () => {
        this.pendingPushRegistration = null;
      },
    );
    return this.pendingPushRegistration;
  }

  /** Registers the resolved token unless the same token is already registered. */
  async performPushRegistration(): Promise<void> {
    if (!this.client.isConnected) {
      return;
    }

    const token = await this.resolvePushToken();
    if (!token) {
      return;
    }

    const registration = await getPushRegistration();
    if (registration.registered && registration.token === token) {
      return;
    }

    await this.client.registerPush(token, isIos ? !__DEV__ : false, isIos);
    this.pushToken = token;
    await savePushRegistration(token);
    console.log('Register push success');
  }

  /** Handles SDK connection success and forwards it to the active UI listener. */
  onConnect = (client: StringeeClient, userId: string): void => {
    console.log('onConnect', userId);
    this.isConnected = true;
    this.isConnecting = false;
    this.registerTokenToStringee().catch(error => {
      console.log('Register push error', error);
    });
    this.listener?.onConnect?.(client, userId);
  };

  /** Handles SDK disconnection and resets local connection flags. */
  onDisConnect = (client: StringeeClient): void => {
    console.log('onDisConnect');
    this.isConnected = false;
    this.isConnecting = false;
    this.listener?.onDisConnect?.(client);
  };

  /** Routes a StringeeCall incoming callback through the call manager. */
  onIncomingCall = (client: StringeeClient, call: StringeeCall): void => {
    this.handleIncomingCall(client, call, false);
  };

  /** Routes a StringeeCall2 incoming callback through the call manager. */
  onIncomingCall2 = (client: StringeeClient, call: StringeeCall2): void => {
    this.handleIncomingCall(client, call, true);
  };

  /** Prepares an incoming call before exposing it to the UI listener. */
  async handleIncomingCall(
    client: StringeeClient,
    call: ActiveCall,
    useCall2: boolean,
  ): Promise<void> {
    console.log(useCall2 ? 'onIncomingCall2' : 'onIncomingCall', call.callId);
    try {
      await StringeeCallManager.instance.handleIncomingCall(call, useCall2);
      if (useCall2) {
        this.listener?.onIncomingCall2?.(client, call as StringeeCall2);
      } else {
        this.listener?.onIncomingCall?.(client, call as StringeeCall);
      }
    } catch (error) {
      console.log('Unable to handle incoming call', error);
    } finally {
      this.resolveIncomingCallWaiters(call.callId);
    }
  }

  /** Handles a client error and forwards it to the active UI listener. */
  onFailWithError = (
    client: StringeeClient,
    code: number,
    message: string,
  ): void => {
    console.log('onFailWithError', code, message);
    this.isConnected = false;
    this.isConnecting = false;
    this.listener?.onFailWithError?.(client, code, message);
  };

  /** Clears an expired token when the SDK requests a replacement. */
  onRequestAccessToken = (client: StringeeClient): void => {
    console.log('onRequestAccessToken');
    this.isConnecting = false;
    clearAccessToken().catch(console.log);
    this.listener?.onRequestAccessToken?.(client);
  };

  /** Installs the permanent SDK listener that forwards events to this manager. */
  setListener(): void {
    const listener = new StringeeClientListener();
    listener.onConnect = this.onConnect;
    listener.onDisConnect = this.onDisConnect;
    listener.onIncomingCall = this.onIncomingCall;
    listener.onIncomingCall2 = this.onIncomingCall2;
    listener.onFailWithError = this.onFailWithError;
    listener.onRequestAccessToken = this.onRequestAccessToken;
    this.client.setListener(listener);
  }

  /**
   * Connects and persists a valid access token.
   * @returns Whether the connection request was accepted.
   */
  connect(token: string): Promise<boolean> {
    return this.connectAndPersist(token);
  }

  /** Internal connection helper that can skip token persistence during restore. */
  async connectAndPersist(token: string, persist = true): Promise<boolean> {
    if (!token || token === 'PUT_YOUR_TOKEN_HERE') {
      console.warn('Please replace PUT_YOUR_TOKEN_HERE with a valid token');
      return false;
    }
    if (persist) {
      await saveAccessToken(token);
    }
    if (!this.client.isConnected && !this.isConnecting) {
      this.isConnecting = true;
      this.client.connect(token);
    }
    return true;
  }

  /** Returns the previously persisted access token. */
  getSavedAccessToken(): Promise<string> {
    return getAccessToken();
  }

  /** Removes the persisted access token. */
  clearSavedAccessToken(): Promise<void> {
    return clearAccessToken();
  }

  /** Returns whether an existing or restored connection is available. */
  async restoreConnection(): Promise<boolean> {
    if (this.client.isConnected) {
      return true;
    }
    const token = await getAccessToken();
    if (!token) {
      return false;
    }
    return this.connectAndPersist(token, false);
  }

  /**
   * Waits for the SDK to emit the matching incoming call in a headless runtime.
   * @param callId Expected Stringee call identifier.
   * @param timeout Maximum wait in milliseconds.
   * @returns Whether the matching call arrived in time.
   */
  waitForIncomingCall(callId: string, timeout = 8000): Promise<boolean> {
    if (StringeeCallManager.instance.matchesCallId(callId)) {
      return Promise.resolve(true);
    }
    return new Promise(resolve => {
      const waiter: IncomingCallWaiter = {
        callId,
        resolve,
        timeoutId: null,
      };
      waiter.timeoutId = setTimeout(() => {
        this.incomingCallWaiters.delete(waiter);
        resolve(false);
      }, timeout);
      this.incomingCallWaiters.add(waiter);
    });
  }

  /** Resolves all headless waiters compatible with an incoming call ID. */
  resolveIncomingCallWaiters(callId: string): void {
    for (const waiter of this.incomingCallWaiters) {
      if (!waiter.callId || !callId || waiter.callId === callId) {
        if (waiter.timeoutId) {
          clearTimeout(waiter.timeoutId);
        }
        this.incomingCallWaiters.delete(waiter);
        waiter.resolve(true);
      }
    }
  }

  /** Disconnects the SDK client without modifying persisted credentials. */
  disconnect(): void {
    this.isConnecting = false;
    this.client.disconnect();
  }

  /** Unregisters the saved platform push token from Stringee. */
  async unregisterPush(): Promise<void> {
    const registration = await getPushRegistration();
    const token = registration.token || this.pushToken;
    if (!registration.registered || !token) {
      return;
    }
    await this.client.unregisterPush(token);
    await clearPushRegistration();
  }
}

export default StringeeClientManager;
