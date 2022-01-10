/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import HomeScreen from './src/HomeScreen';
import CallScreen from './src/CallScreen';
// import notifee from '@notifee/react-native';
import Call2Screen from './src/Call2Screen';

const Stack = createNativeStackNavigator();

export default function App() {
  // notifee.registerForegroundService(notification => {
  //   return new Promise(() => {
  //     // Long running task...
  //   });
  // });

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'React native call sample',
            headerTintColor: '#ffffff',
            headerStyle: {
              backgroundColor: '#E53935',
            },
          }}
        />
        <Stack.Screen
          name="Call"
          component={CallScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Call2"
          component={Call2Screen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
