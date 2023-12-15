/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {App} from './src/component';
import {name as appName} from './app.json';
import {chunk} from './src/utils';

AppRegistry.registerComponent(appName, () => App);
