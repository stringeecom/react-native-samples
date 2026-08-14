import RNVoipPushNotification from 'react-native-voip-push-notification';
import StringeeClientManager from './StringeeClientManager';
import StringeeCallManager from './StringeeCallManager';
import RNCallKeep from 'react-native-callkeep';

const stringeePushConfig = () => {
  if (stringeePushConfig.configured) {
    return;
  }
  stringeePushConfig.configured = true;

  const clientManager = StringeeClientManager.instance;
  const callManager = StringeeCallManager.instance;

  const handledEarlyEvents = new Set();

  const handleCallKeepEvent = event => {
    const name = event?.name;
    const data = event?.data || event || {};
    const uuid = data.callUUID;
    const key = `${name}:${uuid || ''}`;
    if (handledEarlyEvents.has(key)) {
      return;
    }
    handledEarlyEvents.add(key);
    if (name === 'RNCallKeepPerformAnswerCallAction' && uuid) {
      callManager.answeredCallKeepUUIDs.add(uuid);
      callManager.answerRequested = true;
      callManager.answerStringeeCallIfConditionMatch().catch(console.log);
    } else if (name === 'RNCallKeepPerformEndCallAction' && uuid) {
      callManager.callKeepEndCall(uuid).catch(console.log);
    } else if (name === 'RNCallKeepDidActivateAudioSession') {
      callManager.didActiveAudioSession = true;
      callManager.answerStringeeCallIfConditionMatch().catch(console.log);
    }
  };

  const handleVoipNotification = notification => {
    const callId = notification?.callId || '';
    const waiter = clientManager.waitForIncomingCall(callId);
    clientManager
      .restoreConnection()
      .then(restored => (restored ? waiter : false))
      .catch(console.log);
  };

  RNVoipPushNotification.addEventListener('register', token => {
    clientManager.updatePushToken(token);
  });
  RNVoipPushNotification.addEventListener(
    'notification',
    handleVoipNotification,
  );
  RNVoipPushNotification.addEventListener('didLoadWithEvents', events => {
    for (const event of events || []) {
      if (
        event.name ===
        RNVoipPushNotification.RNVoipPushRemoteNotificationsRegisteredEvent
      ) {
        clientManager.updatePushToken(event.data);
      } else if (
        event.name ===
        RNVoipPushNotification.RNVoipPushRemoteNotificationReceivedEvent
      ) {
        handleVoipNotification(event.data);
      }
    }
  });

  RNCallKeep.getCalls().then(async items => {
    try {
      for (const item of items) {
        if (await RNCallKeep.isCallActive(item.callUUID)) {
          callManager.didActiveAudioSession = true;
          break;
        }
      }
    } catch (error) {
      console.log(error);
    }
  });

  RNVoipPushNotification.registerVoipToken();
  clientManager.restoreConnection().catch(console.log);

  RNCallKeep.addEventListener('didLoadWithEvents', events => {
    for (const event of events || []) {
      handleCallKeepEvent(event);
    }
  });
  RNCallKeep.getInitialEvents()
    .then(events => {
      for (const event of events || []) {
        handleCallKeepEvent(event);
      }
      RNCallKeep.clearInitialEvents();
    })
    .catch(console.log);

  RNCallKeep.addEventListener('didDisplayIncomingCall', ({callUUID}) => {
    if (callManager.callKeep && callManager.callKeep.uuid !== callUUID) {
      RNCallKeep.endCall(callUUID);
    }
    setTimeout(() => {
      if (!callManager.callKeep || callManager.callKeep.uuid !== callUUID) {
        console.log('End call time out');
        RNCallKeep.endCall(callUUID);
      }
    }, 8000);
  });

  RNCallKeep.addEventListener('endCall', ({callUUID}) => {
    handledEarlyEvents.add(`RNCallKeepPerformEndCallAction:${callUUID}`);
    callManager.callKeepEndCall(callUUID).catch(console.log);
  });

  RNCallKeep.addEventListener('answerCall', ({callUUID}) => {
    handledEarlyEvents.add(`RNCallKeepPerformAnswerCallAction:${callUUID}`);
    callManager.answeredCallKeepUUIDs.add(callUUID);
    callManager.answerRequested = true;
    callManager.answerStringeeCallIfConditionMatch().catch(console.log);
  });

  RNCallKeep.addEventListener('didActivateAudioSession', () => {
    console.log('didActivateAudioSession');
    callManager.didActiveAudioSession = true;
    callManager.answerStringeeCallIfConditionMatch().catch(console.log);
  });

  RNCallKeep.addEventListener('didDeactivateAudioSession', () => {
    callManager.didActiveAudioSession = false;
  });
};

stringeePushConfig.configured = false;

export default stringeePushConfig;
