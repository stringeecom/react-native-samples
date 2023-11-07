import {
  StringeeClient,
  StringeeClientListener,
  StringeeCall,
  StringeeCall2,
} from 'stringee-react-native-v2';
import messaging from '@react-native-firebase/messaging';
import StringeeCallManager from './StringeeCallManager';
import {isIos} from '../const';
import RNVoipPushNotification from 'react-native-voip-push-notification';

class StringeeClientManager {
  static instance = new StringeeClientManager();
  client: StringeeClient;

  pushToken: string;

  listener: StringeeClientListener;

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
      if (this.listener && this.listener.onConnect) {
        this.listener.onConnect(this.client, userId);
      }
    };
    clientListener.onDisConnect = client => {
      console.log('onDisConnect: ');
      this.isConnected = false;
      if (this.listener.onDisConnect) {
        this.listener.onDisConnect(client);
      }
    };

    clientListener.onIncomingCall = (
      client: StringeeClient,
      call: StringeeCall,
    ) => {
      console.log('onIncomingCall: callId - ', call.callId);
      if (StringeeCallManager.instance.call != null) {
        call.reject();
      } else {
        StringeeCallManager.instance.handleIncomingCall(call);
        if (this.listener && this.listener.onIncomingCall) {
          this.listener.onIncomingCall(client, call);
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
        call.reject();
      } else {
        StringeeCallManager.instance.handleIncomingCall(call);
        if (this.listener.onIncomingCall2) {
          this.listener.onIncomingCall2(client, call);
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
      if (this.listener.onFailWithError) {
        this.listener.onFailWithError(client, code, message);
      }
    };

    clientListener.onRequestAccessToken = () => {
      console.log('onRequestAccessToken');
      if (this.listener.onRequestAccessToken) {
        this.listener.onRequestAccessToken();
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
