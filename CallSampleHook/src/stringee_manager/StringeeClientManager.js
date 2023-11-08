import { StringeeClient, StringeeClientListener } from "stringee-react-native-v2";
import messaging from "@react-native-firebase/messaging";
import StringeeCallManager from "./StringeeCallManager";
import { isIos } from "../const";
import RNVoipPushNotification from "react-native-voip-push-notification";
import { getRegisterStatus, saveRegisterState } from "../storage";

class StringeeClientManager {
  static instance = new StringeeClientManager();
  stringeeClient: StringeeClient;
  pushToken: string;
  listener: StringeeClientListener;
  isConnected: boolean = false;

  constructor() {
    this.stringeeClient = new StringeeClient();
    this.registerEvent();
  }

  updatePushToken(token: string) {
    this.pushToken = token;
    this.stringeeClient.registerPush(
      token,
      false,
      true,
      (status: boolean, code: number, message: string) => {
        console.log("registerPush", status, code, message);
      },
    );
  }

  registerEvent() {
    const clientListener = new StringeeClientListener();
    clientListener.onConnect = this.handleOnConnected;
    clientListener.onDisConnect = this.handleOnDisConnect;
    clientListener.onIncomingCall = this.handleOnIncomingCall;
    clientListener.onIncomingCall2 = this.handleOnIncomingCall2;
    clientListener.onFailWithError = this.handleOnFailWithError;
    clientListener.onRequestAccessToken = this.handleOnRequestAccessToken;
    clientListener.onCustomMessage = this.handleOnCustomMessage;
    this.stringeeClient.registerEvents(clientListener);
  }

  handleOnConnected = async (stringeeClient, userId) => {
    console.log("onConnect", userId);
    this.isConnected = true;
    const isPushRegistered = await getRegisterStatus();
    if (!isPushRegistered) {
      if (isIos) {
        RNVoipPushNotification.onVoipNotificationCompleted("JS_DID_ACTIVE");
        if (this.pushToken) {
          this.stringeeClient.registerPush(
            this.pushToken,
            false,
            true,
            async (status: boolean, code: number, message: string) => {
              console.log("registerPush", status, code, message);
              if (status) {
                await saveRegisterState(true);
              }
            },
          );
        }
      } else {
        messaging()
          .getToken()
          .then(token => {
            this.stringeeClient.registerPush(
              token,
              false,
              true,
              async (status, code, message) => {
                console.log("registerPush", status, code, message);
                if (status) {
                  await saveRegisterState(true);
                }
              },
            );
          });
      }
    }

    if (this.listener && this.listener.onConnect) {
      this.listener.onConnect(this.stringeeClient, userId);
    }
  };

  handleOnDisConnect = stringeeClient => {
    console.log("onDisConnect");
    this.isConnected = false;
    if (this.listener.onDisConnect) {
      this.listener.onDisConnect(stringeeClient);
    }
  };

  handleOnIncomingCall = (stringeeClient, stringeeCall) => {
    console.log("onIncomingCall", JSON.stringify(stringeeCall));
    if (StringeeCallManager.instance.stringeeCall != null) {
      stringeeCall.reject();
    } else {
      StringeeCallManager.instance.handleIncomingCall(stringeeCall);
      if (this.listener && this.listener.onIncomingCall) {
        this.listener.onIncomingCall(stringeeClient, stringeeCall);
      }
    }
  };

  handleOnIncomingCall2 = (stringeeClient, stringeeCall2) => {
    console.log("onIncomingCall2", JSON.stringify(stringeeCall2));
    if (StringeeCallManager.instance.stringeeCall != null) {
      stringeeCall2.reject();
    } else {
      StringeeCallManager.instance.handleIncomingCall(stringeeCall2);
      if (this.listener.onIncomingCall2) {
        this.listener.onIncomingCall2(stringeeClient, stringeeCall2);
      }
    }
  };

  handleOnFailWithError = (stringeeClient, code, message) => {
    console.log("onFailWithError", code, message);
    this.isConnected = false;
    if (this.listener.onFailWithError) {
      this.listener.onFailWithError(stringeeClient, code, message);
    }
  };

  handleOnRequestAccessToken = stringeeClient => {
    console.log("onRequestAccessToken");
    if (this.listener.onRequestAccessToken) {
      this.listener.onRequestAccessToken();
    }
  };

  handleOnCustomMessage = (stringeeClient, from, data) => {
    console.log("onCustomMessage", from, data);
  };

  connect(token: string) {
    this.stringeeClient.connect(token);
  }

  disconnect() {
    this.stringeeClient.disconnect();
  }

  unregisterPush() {
    this.stringeeClient.unregisterPush(
      this.pushToken,
      async (status, code, desc) => {
        console.log("unregisterPush", status, code, desc);
        if (status) {
          await saveRegisterState(false);
        }
      },
    );
  }
}

export default StringeeClientManager;
