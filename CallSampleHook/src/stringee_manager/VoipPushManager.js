import RNVoipPushNotification from 'react-native-voip-push-notification';
import StringeeClientManager from './StringeeClientManager';
import StringeeCallManager from './StringeeCallManager';
import RNCallKeep from 'react-native-callkeep';

const stringeePushConfig = () => {
  const client = StringeeClientManager.instance;
  const call = StringeeCallManager.instance;
  RNVoipPushNotification.registerVoipToken();

  console.log('config push ');

  RNVoipPushNotification.addEventListener('register', token => {
    client.updatePushToken(token);
  });

  RNVoipPushNotification.addEventListener('notification', data => {
    call.handleCallkeep(data);
    console.log('push data', data);
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

  RNCallKeep.addEventListener('didActivateAudioSession', () => {
    call.answerCallKeep();
  });
};

export default stringeePushConfig;
