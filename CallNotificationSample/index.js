/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import RNCallKeep from 'react-native-callkeep';

const options = {
    ios: {
        appName: 'Stringee',
        includesCallsInRecents: false,
    },
};

AppRegistry.registerComponent(appName, () => App);

AppRegistry.registerHeadlessTask('CallBackgroundActions', () => {
    RNCallKeep.setup(options);
    RNCallKeep.setAvailable(true);
});

