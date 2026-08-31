import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens(true);

import registerCallableModule from 'react-native/Libraries/Core/registerCallableModule';

// Register legacy RCTEventEmitter for New Architecture Fabric backwards compatibility
registerCallableModule('RCTEventEmitter', {
  receiveEvent(rootNodeID, topLevelType, nativeEventParam) {},
  receiveTouches(eventTopLevelType, touches, changedIndices) {},
});

import {AppRegistry, LogBox, Text, TextInput} from 'react-native';
import {name as appName} from './app.json';
import App from './src/App';

// Global support for font scaling
if (Text.defaultProps) {
  Text.defaultProps.allowFontScaling = true;
} else {
  Text.defaultProps = {
    allowFontScaling: true,
  };
}

if (TextInput.defaultProps) {
  TextInput.defaultProps.allowFontScaling = true;
} else {
  TextInput.defaultProps = {
    allowFontScaling: true,
  };
}
 
AppRegistry.registerComponent(appName, () => App);
LogBox.ignoreAllLogs();



