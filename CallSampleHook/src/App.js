import React from 'react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import reducers from './reducers';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import {HomeScreen} from './components/home';
import {
  ANSWER_ACTION_ID,
  CALL_SCREEN_NAME,
  HOME_SCREEN_NAME,
  NOTIFICATION_ID,
  OPEN_APP_IN_FULL_SCREEN_MODE_ACTION_ID,
  REJECT_ACTION_ID,
} from './const';
import {CallScreen} from './components/call';
import 'react-native-reanimated';
import notifee, {EventType} from '@notifee/react-native';
import StringeeCallManager from './stringee_manager/StringeeCallManager';

const store = configureStore({
  reducer: reducers,
});

const Stack = createNativeStackNavigator();

/**
 * handle press action from notification when app is in background
 */
notifee.onBackgroundEvent(async event => {
  console.log('onBackgroundEvent' + JSON.stringify(event.detail.pressAction));
  if (event.type === EventType.ACTION_PRESS) {
    switch (event.detail.pressAction.id) {
      case ANSWER_ACTION_ID:
        if (StringeeCallManager.instance.call) {
          StringeeCallManager.instance.answer((status, _, __) => {
            if (StringeeCallManager.instance.didAnswer && status) {
              StringeeCallManager.instance.didAnswer();
            }
          });
        }
        break;
      case REJECT_ACTION_ID:
        StringeeCallManager.instance.rejectCall();
        StringeeCallManager.instance.endSectionCall();
        break;
      case OPEN_APP_IN_FULL_SCREEN_MODE_ACTION_ID:
        break;
    }
    await notifee.cancelNotification(NOTIFICATION_ID);
  }
});

const App = () => {
  return (
    <NavigationContainer>
      <Provider store={store}>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name={HOME_SCREEN_NAME} component={HomeScreen} />
          <Stack.Screen name={CALL_SCREEN_NAME} component={CallScreen} />
        </Stack.Navigator>
      </Provider>
    </NavigationContainer>
  );
};

export default App;
