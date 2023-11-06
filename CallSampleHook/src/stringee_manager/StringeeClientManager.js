import {
  StringeeClient,
  StringeeClientListener,
  StringeeCall,
  StringeeCall2,
} from 'stringee-react-native-v2';
import messaging from '@react-native-firebase/messaging';
import StringeeCallManager from './StringeeCallManager';
import {isIos} from '../const';
import InCallManager from 'react-native-incall-manager';
import RNVoipPushNotification from 'react-native-voip-push-notification';

class StringeeClientManager {
  static instance = new StringeeClientManager();
  client: StringeeClient;

  pushToken: string;

  listenner: StringeeClientListener;

  isConnected: boolean = false;

  constructor() {
    this.client = new StringeeClient();
    this.registerEvent();
  }

  updatePushToken(token: string) {
    console.log('token', token);
    this.pushToken = token;
    this.client.registerPush(
      token,
      false,
      true,
      (status: boolean, code: number, message: string) => {
        console.log('registerPush', status, code, message);
      },
    );
  }

  registerEvent() {
    const clientListener = new StringeeClientListener();
    clientListener.onConnect = (_, userId: string) => {
      console.log('onConnect: ', userId);
      this.isConnected = true;
      if (isIos) {
        console.log('Register push ios: ', this.pushToken);
        RNVoipPushNotification.onVoipNotificationCompleted('JS_DID_ACTIVE');
        if (this.pushToken) {
          console.log('register push while client connected');
          this.client.registerPush(
            this.pushToken,
            false,
            true,
            (status: boolean, code: number, message: string) => {
              console.log('registerPush', status, code, message);
            },
          );
        }
      } else {
        console.log('Register push android');
        messaging()
          .getToken()
          .then(token => {
            this.client.registerPush(
              token,
              false,
              true,
              (result, code, desc) => {
                console.log(
                  'registerPush: result-' +
                    result +
                    ' code-' +
                    code +
                    ' desc-' +
                    desc,
                );
              },
            );
          });
      }
      if (this.listenner.onConnect) {
        this.listenner.onConnect(this.client, userId);
      }
    };
    clientListener.onDisConnect = client => {
      console.log('onDisConnect: ');
      this.isConnected = false;
      if (this.listenner.onDisConnect) {
        this.listenner.onDisConnect(client);
      }
    };

    clientListener.onIncomingCall = (
      client: StringeeClient,
      call: StringeeCall,
    ) => {
      console.log('onIncomingCall: callId - ', call.callId);
      if (StringeeCallManager.instance.call != null) {
        console.log('busy call');
        call.reject();
      } else {
        if (!isIos) {
          InCallManager.startRingtone('_BUNDLE_');
        }
        StringeeCallManager.instance.handleIncomingCall(call);
        if (this.listenner.onIncomingCall) {
          this.listenner.onIncomingCall(client, call);
        }
      }
    };

    clientListener.onIncomingCall2 = (
      client: StringeeClient,
      call: StringeeCall2,
    ) => {
      if (call == null) {
        console.log('sdk invalid: ');
        return;
      }

      console.log('onIncomingCall2: callId - ', call.callId);
      if (StringeeCallManager.instance.call != null) {
        console.log('busy call');
        call.reject();
      } else {
        if (!isIos) {
          InCallManager.startRingtone('_BUNDLE_');
        }
        StringeeCallManager.instance.handleIncomingCall(call);
        if (this.listenner.onIncomingCall2) {
          this.listenner.onIncomingCall2(client, call);
        }
      }
    };

    clientListener.onFailWithError = (
      client: StringeeClient,
      code: number,
      message: string,
    ) => {
      console.log('onFailWithError: code-' + code + ' message: ' + message);
      this.isConnected = false;
      if (this.listenner.onFailWithError) {
        this.listenner.onFailWithError(client, code, message);
      }
    };

    clientListener.onRequestAccessToken = () => {
      console.log('onRequestAccessToken');
      if (this.listenner.onRequestAccessToken) {
        this.listenner.onRequestAccessToken();
      }
    };
    this.client.registerEvents(clientListener);
  }

  connect(token: string) {
    this.client.connect(token);
  }

  disconnect() {
    this.client.disconnect();
  }

  unregisterPush() {
    this.client.unregisterPush(this.pushToken);
  }
}

export default StringeeClientManager;
