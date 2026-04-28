/**
 * @format
 */

import {AppRegistry, LogBox} from 'react-native';
import {name as appName} from './app.json';
import App from './src/App';
 
AppRegistry.registerComponent(appName, () => App);
LogBox.ignoreAllLogs();



