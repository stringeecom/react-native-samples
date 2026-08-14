import React from 'react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import reducers from './reducers';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import {HomeScreen} from './components/home';
import {CALL_SCREEN_NAME, HOME_SCREEN_NAME} from './const';
import {CallScreen} from './components/call';
import 'react-native-reanimated';
import type {RootStackParamList} from './types';

const store = configureStore({
  reducer: reducers,
});

const Stack = createNativeStackNavigator<RootStackParamList>();

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
