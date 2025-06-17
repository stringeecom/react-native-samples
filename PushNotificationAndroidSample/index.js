/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidCategory,
  AndroidImportance,
} from '@notifee/react-native';
import NotificationCommon from './src/NotificationCommon';

async function onMessageReceived(message) {
  const data = JSON.parse(message.data.data);
  const callStatus = data.callStatus;
  const from = data.from.number;
  console.log('data: ' + JSON.stringify(data));
  const channelId = await notifee.createChannel({
    id: NotificationCommon.channelId,
    name: NotificationCommon.channelName,
    description: NotificationCommon.channelDescription,
    vibration: true,
  });
  switch (callStatus) {
    case 'started':
      await notifee.displayNotification({
        id: NotificationCommon.notificationId,
        title: 'Incoming Call',
        body: 'Call from ' + from,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.CALL,
          autoCancel: false,
          ongoing: true,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          actions: [
            {
              title: 'Answer',
              pressAction: {
                id: 'answer',
                launchActivity: 'default',
              },
            },
            {
              title: 'Reject',
              pressAction: {
                id: 'reject',
                launchActivity: 'default',
              },
            },
          ],
          fullScreenAction: {
            id: 'default',
            launchActivity: 'default',
          },
        },
      });
      break;
    case 'ended':
      await notifee.cancelNotification(NotificationCommon.notificationId);
      break;
  }
}

messaging().setBackgroundMessageHandler(onMessageReceived);

AppRegistry.registerComponent(appName, () => App);
