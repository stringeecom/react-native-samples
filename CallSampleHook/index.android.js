import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import {NOTIFICATION_ID} from './src/const';
import StringeeCallManager from './src/stringee_manager/StringeeCallManager';
import StringeeClientManager from './src/stringee_manager/StringeeClientManager';
import {access_token} from './src/components/home';

/**
 * Handle message from firebase and show the call notification
 * @param message
 */
async function onMessageReceived(message) {
  const data = JSON.parse(message.data.data);
  console.log('data: ' + JSON.stringify(data));
  const stringeeClientManager = StringeeClientManager.instance;
  if (!stringeeClientManager.client.isConnected) {
    stringeeClientManager.connect(access_token);
  }
  switch (data.callStatus) {
    case 'ended':
    case 'agentEnded':
    case 'answered':
      StringeeCallManager.instance.endCallSection();
      await notifee.cancelNotification(NOTIFICATION_ID);
      break;
  }
}

/**
 * Listen message from firebase when app is in background or killed
 */
messaging().setBackgroundMessageHandler(onMessageReceived);

AppRegistry.registerComponent(appName, () => App);
