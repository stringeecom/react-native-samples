import {
  StringeeCall,
  StringeeCall2,
  StringeeClient,
  StringeeClientListener,
} from 'stringee-react-native-v2';
import messaging from '@react-native-firebase/messaging';
import StringeeCallManager from './StringeeCallManager';
import {isIos} from '../const';
import RNVoipPushNotification from 'react-native-voip-push-notification';
import {getRegisterStatus, saveRegisterState} from '../storage';

class StringeeClientManager {
  static instance = new StringeeClientManager();
  client: StringeeClient;

  pushToken: string;

  listener: StringeeClientListener;

  isConnected: boolean = false;

  constructor() {
    this.client = new StringeeClient();
    this.setListener();
  }

  updatePushToken(token: string) {
    console.log('token', token);
    this.pushToken = token;
    this.client.registerPush(token, false, true).then().catch(console.log);
  }

  onConnect = async (_, userId: string) => {
    try {
      console.log('onConnect', userId);
      this.isConnected = true;
      const isPushRegistered = await getRegisterStatus();
      if (!isPushRegistered) {
        if (isIos) {
          console.log('Register push ios', this.pushToken);
          RNVoipPushNotification.onVoipNotificationCompleted('JS_DID_ACTIVE');
          if (this.pushToken) {
            console.log('register push while client connected');
            await this.client.registerPush(this.pushToken, false, true);
            await saveRegisterState(true);
          }
        } else {
          console.log('Register push android');
          let token = await messaging().getToken();
          await this.client.registerPush(token, false, true);
          await saveRegisterState(true);
        }
      }
    } catch (error) {
      console.log(error);
    }
    if (this.listener && this.listener.onConnect) {
      this.listener.onConnect(this.client, userId);
    }
  };
  onDisConnect = client => {
    console.log('onDisConnect');
    this.isConnected = false;
    if (this.listener.onDisConnect) {
      this.listener.onDisConnect(client);
    }
  };
  onIncomingCall = (client: StringeeClient, call: StringeeCall) => {
    console.log('onIncomingCall', call.callId);
    if (StringeeCallManager.instance.call != null) {
      call.reject();
    } else {
      StringeeCallManager.instance.handleIncomingCall(call);
      if (this.listener.onIncomingCall) {
        this.listener.onIncomingCall(client, call);
      }
    }
  };

  onIncomingCall2 = (client: StringeeClient, call: StringeeCall2) => {
    console.log('onIncomingCall2', call.callId);
    if (StringeeCallManager.instance.call != null) {
      call.reject();
    } else {
      StringeeCallManager.instance.handleIncomingCall(call);
      if (this.listener.onIncomingCall2) {
        this.listener.onIncomingCall2(client, call);
      }
    }
  };

  onFailWithError = (client: StringeeClient, code: number, message: string) => {
    console.log('onFailWithError', code, message);
    this.isConnected = false;
    if (this.listener.onFailWithError) {
      this.listener.onFailWithError(client, code, message);
    }
  };

  onRequestAccessToken = () => {
    console.log('onRequestAccessToken');
    if (this.listener.onRequestAccessToken) {
      this.listener.onRequestAccessToken();
    }
  };

  setListener() {
    const clientListener = new StringeeClientListener();
    clientListener.onConnect = this.onConnect;
    clientListener.onDisConnect = this.onDisConnect;
    clientListener.onIncomingCall = this.onIncomingCall;
    clientListener.onIncomingCall2 = this.onIncomingCall2;
    clientListener.onFailWithError = this.onFailWithError;
    clientListener.onRequestAccessToken = this.onRequestAccessToken;
    this.client.setListener(clientListener);
  }

  connect(token: string) {
    this.client.connect(token);
  }

  disconnect() {
    this.client.disconnect();
  }

  async unregisterPush() {
    await this.client.unregisterPush(this.pushToken);
    await saveRegisterState(false);
  }
}

export default StringeeClientManager;
