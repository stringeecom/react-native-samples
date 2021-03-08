/**
 * @format
 */

import {AppRegistry, Platform} from 'react-native';
import App from './App';
import AppAndroid from './AppAndroid';
import {name as appName} from './app.json';
import CallScreen from './src/CallScreen';
import RNCallKeep from 'react-native-callkeep';

// Android only ----------
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
// -----------------------

const options = {
  ios: {
    appName: 'Stringee',
    includesCallsInRecents: false,
  },
};

if (Platform.OS === 'android') {
  async function onMessageReceived(message) {
    const data = JSON.parse(message.data.data);
    const callStatus = data.callStatus;
    const from = data.from.number;
    const notificationId = '11111'; // YOUR_NOTIFICATION_ID
    console.log('data: ' + callStatus);
    const channelId = await notifee.createChannel({
      id: 'YOUR_CHANNEL_ID',
      name: 'ChannelName',
      vibration: true,
    });
    switch (callStatus) {
      case 'started':
        await notifee.displayNotification({
          id: notificationId,
          title: 'Incoming Call',
          body: 'Call from ' + from,
          android: {
            channelId,
            pressAction: {
              id: 'default',
              mainComponent: appName,
            },
          },
        });
        break;
      case 'ended':
        await notifee.cancelNotification(notificationId);
        break;
    }
  }

  messaging().setBackgroundMessageHandler(onMessageReceived);

  AppRegistry.registerComponent(appName, () => AppAndroid);
} else {
  AppRegistry.registerComponent(appName, () => App);
}

AppRegistry.registerHeadlessTask('CallBackgroundActions', () => {
  RNCallKeep.setup(options);
  RNCallKeep.setAvailable(true);
});
