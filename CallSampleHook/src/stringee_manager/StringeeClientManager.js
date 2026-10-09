import {StringeeClient, StringeeClientListener} from 'stringee-react-native-v2';
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

  client = new StringeeClient();
  listener = null;
  pushToken = '';
  isConnected = false;
  isConnecting = false;
  pendingPushRegistration = null;
  incomingCallWaiters = new Set();

  /** Creates the SDK client and installs its permanent forwarding listener. */
  constructor() {
    this.setListener();
  }

  /**
   * Stores a new platform push token and registers it when already connected.
   * @param {string} token FCM or PushKit token.
   */
  updatePushToken(token) {
    if (!token) {
      return;
    }
    this.pushToken = token;
    if (this.client.isConnected) {
      this.registerTokenToStringee().catch(console.log);
    }
  }

  /** @returns {Promise<string>} Current platform-specific push token. */
  async resolvePushToken() {
    if (isIos) {
      return this.pushToken;
    }
    return messaging().getToken();
  }

  /** @returns {Promise<void>} Shared in-flight Stringee registration operation. */
  registerTokenToStringee() {
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
  async performPushRegistration() {
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
  onConnect = (client, userId) => {
    console.log('onConnect', userId);
    this.isConnected = true;
    this.isConnecting = false;
    this.registerTokenToStringee().catch(error => {
      console.log('Register push error', error);
    });
    this.listener?.onConnect?.(client, userId);
  };

  /** Handles SDK disconnection and resets local connection flags. */
  onDisConnect = client => {
    console.log('onDisConnect');
    this.isConnected = false;
    this.isConnecting = false;
    this.listener?.onDisConnect?.(client);
  };

  /** Routes a StringeeCall incoming callback through the call manager. */
  onIncomingCall = (client, call) => {
    this.handleIncomingCall(client, call, false);
  };

  /** Routes a StringeeCall2 incoming callback through the call manager. */
  onIncomingCall2 = (client, call) => {
    this.handleIncomingCall(client, call, true);
  };

  /**
   * Prepares an incoming call before exposing it to the UI listener.
   * @param {object} client Source Stringee client.
   * @param {object} call Incoming Stringee call.
   * @param {boolean} useCall2 Whether the call uses StringeeCall2.
   * @returns {Promise<void>}
   */
  async handleIncomingCall(client, call, useCall2) {
    console.log(useCall2 ? 'onIncomingCall2' : 'onIncomingCall', call.callId);
    try {
      await StringeeCallManager.instance.handleIncomingCall(call, useCall2);
      const callback = useCall2
        ? this.listener?.onIncomingCall2
        : this.listener?.onIncomingCall;
      callback?.(client, call);
    } catch (error) {
      console.log('Unable to handle incoming call', error);
    } finally {
      this.resolveIncomingCallWaiters(call.callId);
    }
  }

  /** Handles a client error and forwards it to the active UI listener. */
  onFailWithError = (client, code, message) => {
    console.log('onFailWithError', code, message);
    this.isConnected = false;
    this.isConnecting = false;
    this.listener?.onFailWithError?.(client, code, message);
  };

  /** Clears an expired token when the SDK requests a replacement. */
  onRequestAccessToken = client => {
    console.log('onRequestAccessToken');
    this.isConnecting = false;
    clearAccessToken().catch(console.log);
    this.listener?.onRequestAccessToken?.(client);
  };

  /**
   * Called about 60 seconds before the access token expires. This sample has no
   * token server, so it only logs the event. A real app gets a new token for the
   * same user from its server and renews the open connection, for example:
   *   const newToken = await fetchTokenFromYourServer();
   *   await client.updateToken(newToken);
   *   await saveAccessToken(newToken);
   * Without renewal the server disconnects when the token expires and
   * onRequestAccessToken is called.
   */
  onTokenWillExpire = (client, exp, expireInSeconds) => {
    console.log('onTokenWillExpire', exp, expireInSeconds);
  };

  /** Installs the permanent SDK listener that forwards events to this manager. */
  setListener() {
    const clientListener = new StringeeClientListener();
    clientListener.onConnect = this.onConnect;
    clientListener.onDisConnect = this.onDisConnect;
    clientListener.onIncomingCall = this.onIncomingCall;
    clientListener.onIncomingCall2 = this.onIncomingCall2;
    clientListener.onFailWithError = this.onFailWithError;
    clientListener.onRequestAccessToken = this.onRequestAccessToken;
    clientListener.onTokenWillExpire = this.onTokenWillExpire;
    this.client.setListener(clientListener);
  }

  /**
   * Connects and persists a valid access token.
   * @param {string} token Stringee access token.
   * @returns {Promise<boolean>} Whether the connection request was accepted.
   */
  connect(token) {
    return this.connectAndPersist(token);
  }

  /** Internal connection helper that can skip token persistence during restore. */
  async connectAndPersist(token, persist = true) {
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

  /** @returns {Promise<string>} Previously persisted access token. */
  getSavedAccessToken() {
    return getAccessToken();
  }

  /** @returns {Promise<void>} Completion of removing the persisted token. */
  clearSavedAccessToken() {
    return clearAccessToken();
  }

  /** @returns {Promise<boolean>} Whether an existing or restored connection is available. */
  async restoreConnection() {
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
   * @param {string} callId Expected Stringee call identifier.
   * @param {number} [timeout=8000] Maximum wait in milliseconds.
   * @returns {Promise<boolean>} Whether the matching call arrived in time.
   */
  waitForIncomingCall(callId, timeout = 8000) {
    if (StringeeCallManager.instance.matchesCallId(callId)) {
      return Promise.resolve(true);
    }
    return new Promise(resolve => {
      const waiter = {callId, resolve, timeoutId: null};
      waiter.timeoutId = setTimeout(() => {
        this.incomingCallWaiters.delete(waiter);
        resolve(false);
      }, timeout);
      this.incomingCallWaiters.add(waiter);
    });
  }

  /** Resolves all headless waiters compatible with an incoming call ID. */
  resolveIncomingCallWaiters(callId) {
    for (const waiter of this.incomingCallWaiters) {
      if (!waiter.callId || !callId || waiter.callId === callId) {
        clearTimeout(waiter.timeoutId);
        this.incomingCallWaiters.delete(waiter);
        waiter.resolve(true);
      }
    }
  }

  /** Disconnects the SDK client without modifying persisted credentials. */
  disconnect() {
    this.isConnecting = false;
    this.client.disconnect();
  }

  /** Unregisters the saved platform push token from Stringee. */
  async unregisterPush() {
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
