import RNVoipPushNotification from 'react-native-voip-push-notification';
import StringeeClientManager from './StringeeClientManager';
import StringeeCallManager from './StringeeCallManager';
import RNCallKeep from 'react-native-callkeep';

const stringeePushConfig = () => {
  const client = StringeeClientManager.instance;
  const call = StringeeCallManager.instance;
  RNVoipPushNotification.registerVoipToken();

  RNVoipPushNotification.addEventListener('register', token => {
    client.updatePushToken(token);
  });

  RNVoipPushNotification.addEventListener('notification', payload => {
    call.callKeeps.push(payload);
  });

  RNCallKeep.addEventListener('endCall', ({callUUID}) => {
    call.endCallKeep(callUUID);
  });

  RNCallKeep.addEventListener('answerCall', ({callUUID}) => {
    call.handleAnswerCallKeep(callUUID);
  });

  RNCallKeep.addEventListener('didActivateAudioSession', () => {
    call.answerCallKeep();
  });
};

export default stringeePushConfig;
