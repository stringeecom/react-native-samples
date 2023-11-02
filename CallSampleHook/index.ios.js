/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import RNCallKeep from 'react-native-callkeep';
import stringeePushConfig from './src/stringee_manager/VoipPushManager';

AppRegistry.registerComponent(appName, () => App);

AppRegistry.registerHeadlessTask('CallBackgroundActions', () => {
  RNCallKeep.setup({
    ios: {
      appName: appName,
      includesCallsInRecents: true,
    },
  });
  RNCallKeep.setAvailable(true);
});

RNCallKeep.setup({
  ios: {
    appName: appName,
    includesCallsInRecents: true,
  },
});

stringeePushConfig();
