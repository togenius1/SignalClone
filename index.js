import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import Amplify from 'aws-amplify';
import config from './src/aws-exports';
import 'react-native-get-random-values';

// Amplify.configure(config);
Amplify.configure({
  ...config,
  Analytics: {
    disabled: true,
  },
});

AppRegistry.registerComponent(appName, () => App);
