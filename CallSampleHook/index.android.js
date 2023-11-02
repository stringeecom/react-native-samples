/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidCategory,
  AndroidImportance,
  EventType,
} from '@notifee/react-native';
import {
  ANSWER_ACTION_ID, CALL_SCREEN_NAME,
  CHANNEL_DESCRIPTION,
  CHANNEL_ID,
  CHANNEL_NAME,
  NOTIFICATION_ID,
  OPEN_APP_ACTION_ID,
  OPEN_APP_IN_FULL_SCREEN_MODE_ACTION_ID,
  REJECT_ACTION_ID,
} from './src/const';
import StringeeCallManager from './src/stringee_manager/StringeeCallManager';
import CallScreen from './src/components/Call/CallScreen';

/**
 * handle message from firebase and show the call notification
 * @param message
 * @returns {Promise<void>}
 */
async function onMessageReceived(message) {
  const data = JSON.parse(message.data.data);
  const callStatus = data.callStatus;
  const from = data.from.number;
  console.log('data: ' + JSON.stringify(data));
  const channelId = await notifee.createChannel({
    id: CHANNEL_ID,
    name: CHANNEL_NAME,
    description: CHANNEL_DESCRIPTION,
    vibration: true,
  });
  switch (callStatus) {
    case 'started':
      await notifee.displayNotification({
        id: NOTIFICATION_ID,
        title: 'Incoming Call',
        body: 'Call from ' + from,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.CALL,
          autoCancel: false,
          ongoing: true,
          pressAction: {
            id: OPEN_APP_ACTION_ID,
            launchActivity: 'default',
          },
          actions: [
            {
              title: 'Answer',
              pressAction: {
                id: ANSWER_ACTION_ID,
                launchActivity: 'default',
              },
            },
            {
              title: 'Reject',
              pressAction: {
                id: REJECT_ACTION_ID,
              },
            },
          ],
          fullScreenAction: {
            id: OPEN_APP_IN_FULL_SCREEN_MODE_ACTION_ID,
            launchActivity: 'default',
          },
        },
      });
      break;
    case 'ended':
    case 'agentEnded':
      StringeeCallManager.instance.endSectionCall();
      await notifee.cancelNotification(NOTIFICATION_ID);
      break;
  }
}

/**
 * listen message from firebase when app is in background or killed
 */
messaging().setBackgroundMessageHandler(onMessageReceived);

AppRegistry.registerComponent(appName, () => App);
