/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import CallScreen from './src/CallScreen';

async function onMessageReceived(message) {
  console.log('message' + JSON.stringify(message));
  const channelId = await notifee.createChannel({
    id: 'incomingCall',
    name: 'ChannelName',
    lights: false,
    vibration: true,
  });

  notifee.displayNotification({
    title: 'IncomingCall',
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
messaging().onMessage(onMessageReceived);

AppRegistry.registerComponent(appName, () => CallScreen);
