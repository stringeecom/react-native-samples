import RNVoipPushNotification from "react-native-voip-push-notification";
import StringeeClientManager from "./StringeeClientManager";
import StringeeCallManager from "./StringeeCallManager";
import RNCallKeep from "react-native-callkeep";

const stringeePushConfig = () => {
  const client = StringeeClientManager.instance;
  const call = StringeeCallManager.instance;

  RNVoipPushNotification.addEventListener("register", token => {
    client.updatePushToken(token);
  });

  RNVoipPushNotification.addEventListener("notification", payload => {
    call.callKeeps.push(payload);
  });

  RNVoipPushNotification.addEventListener("didLoadWithEvents", events => {
    if (!events || !Array.isArray(events) || events.length < 1) {
      return;
    }
    for (let voipEvent of events) {
      let { name, data } = voipEvent;
      if (name === RNVoipPushNotification.RNVoipPushRemoteNotificationsRegisteredEvent) {
        client.updatePushToken(data);
      }
      if (name === RNVoipPushNotification.RNVoipPushRemoteNotificationReceivedEvent) {
        call.handleCallkeep(data);
        RNVoipPushNotification.onVoipNotificationCompleted(data.uuid);
      }
    }
  });

  RNVoipPushNotification.registerVoipToken();

  RNCallKeep.addEventListener("didDisplayIncomingCall", ({ callUUID }) => {
    setTimeout(() => {
      if (!call.stringeeCall) {
        RNCallKeep.endCall(callUUID);
      }
    }, 5000);
  });

  RNCallKeep.addEventListener("endCall", ({ callUUID }) => {
    if (call.callKeeps.find(item => item.uuid === callUUID) != null) {
      call.endCallKeep(callUUID);
    }
  });

  RNCallKeep.addEventListener("answerCall", ({ callUUID }) => {
    call.handleAnswerCallKeep(callUUID);
  });

  RNCallKeep.addEventListener("didActivateAudioSession", () => {
    call.answerCallKeep();
  });
};

export default stringeePushConfig;
