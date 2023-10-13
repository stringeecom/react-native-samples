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
} from '@notifee/react-native';
import {
  ANSWER_ACTION_ID,
  CHANNEL_DESCRIPTION,
  CHANNEL_ID,
  CHANNEL_NAME,
  NOTIFICATION_ID,
  OPEN_APP_ACTION_ID,
  OPEN_APP_IN_FULL_SCREEN_MODE_ACTION_ID,
  REJECT_ACTION_ID,
} from './src/const';
import StringeeCallManager from './src/stringee_manager/StringeeCallManager';
import StringeeClientManager from './src/stringee_manager/StringeeClientManager';
import {stringee_token} from './src/components/Home';

/**
 * handle message from firebase and show the call notification
 * @param message
 * @returns {Promise<void>}
 */
async function onMessageReceived(message) {
  const data = JSON.parse(message.data.data);
  console.log('data: ' + JSON.stringify(data));
  const stringeeClientManager = StringeeClientManager.instance;
  if (!stringeeClientManager.client.isConnected) {
    stringeeClientManager.connect(stringee_token);
  }
  switch (data.callStatus) {
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
