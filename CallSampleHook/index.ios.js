import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import stringeePushConfig from './src/stringee_manager/VoipPushManager';

AppRegistry.registerComponent(appName, () => App);

AppRegistry.registerHeadlessTask('background', () => {
  console.log('background task');
  stringeePushConfig();
});

stringeePushConfig();
