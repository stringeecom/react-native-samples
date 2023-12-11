import RNVoipPushNotification from 'react-native-voip-push-notification';
import StringeeClientManager from './StringeeClientManager';
import StringeeCallManager from './StringeeCallManager';
import RNCallKeep from 'react-native-callkeep';
import {SignalingState} from 'stringee-react-native-v2';

const stringeePushConfig = () => {
  const clientManager = StringeeClientManager.instance;
  const callManager = StringeeCallManager.instance;

  RNCallKeep.setup({
    ios: {
      appName: 'CallSampleHook',
      includesCallsInRecents: true,
    },
  });

  RNVoipPushNotification.addEventListener('register', token => {
    clientManager.updatePushToken(token);
  });

  RNCallKeep.getCalls().then(async items => {
    try {
      items.forEach(async item => {
        if (await RNCallKeep.isCallActive(item.callUUID)) {
          this.call.didActiveAudioSection = true;
          return;
        }
      });
    } catch (error) {
      console.log(error);
    }
  });

  RNVoipPushNotification.registerVoipToken();

  RNCallKeep.addEventListener('didDisplayIncomingCall', ({callUUID}) => {
    if (callManager.callKeeps && callManager.callKeeps.uuid !== callUUID) {
      RNCallKeep.endAllCalls(callUUID);
    }
    setTimeout(() => {
      if (!callManager.call) {
        console.log('End call time out');
        RNCallKeep.endCall(callUUID);
      }
    }, 5000);
  });

  RNCallKeep.addEventListener('endCall', ({callUUID}) => {
    callManager.callKeepEndCall(callUUID);
  });

  RNCallKeep.addEventListener('answerCall', ({callUUID}) => {
    callManager.callkeepAnswered.push(callUUID);
    callManager.signalingState = SignalingState.answered;
    callManager.answerStringeeCallIfConditionMatch();
  });

  RNCallKeep.addEventListener('didActivateAudioSession', () => {
    console.log('didActivateAudioSession');
    callManager.didActiveAudioSection = true;
    callManager.answerStringeeCallIfConditionMatch();
  });

  RNCallKeep.addEventListener('didDeactivateAudioSession', () => {
    callManager.didActiveAudioSection = false;
  });
};

export default stringeePushConfig;
