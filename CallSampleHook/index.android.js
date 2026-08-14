import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import AndroidPushManager from './src/stringee_manager/AndroidPushManager';

AndroidPushManager.instance.configure();

AppRegistry.registerComponent(appName, () => App);
