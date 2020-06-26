/**
 * @format
 */

import {AppRegistry, Platform} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import CallScreen from './src/CallScreen';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

if (Platform.OS === 'android') {
  async function onMessageReceived(message) {
    console.log('message' + JSON.stringify(message));
    const channelId = await notifee.createChannel({
      id: 'YOUR_CHANNEL_ID',
      name: 'ChannelName',
      vibration: true,
    });

    await notifee.displayNotification({
      id: '123456789',
      title: 'call 2',
      body: 'New incoming Call',
      android: {
        channelId,
        pressAction: {
          id: 'default',
          mainComponent: appName,
        },
      },
    });
  }

  messaging().setBackgroundMessageHandler(onMessageReceived);
}

AppRegistry.registerComponent(appName, () => App);
