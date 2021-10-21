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
import RoomScreen from './src/RoomScreen';
import notifee from '@notifee/react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  notifee.registerForegroundService(notification => {
    return new Promise(() => {
      // Long running task...
    });
  });

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'React native video conference sample',
            headerTintColor: '#ffffff',
            headerStyle: {
              backgroundColor: '#E53935',
            },
          }}
        />
        <Stack.Screen
          name="Room"
          component={RoomScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
