/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View} from 'react-native';
import Customer from './src/Customer';
import Agent from './src/Agent';
import NavigationContainer from '@react-navigation/native/src/NavigationContainer';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#e91e63',
        }}>

        <Tab.Screen
          name="Customer"
          component={Customer}
          options={{
            headerShown: false,
            tabBarLabel: 'Customer',
            tabBarIcon: ({}) => <View />,
          }}
        />
        <Tab.Screen
          name="Agent"
          component={Agent}
          options={{
            headerShown: false,
            tabBarLabel: 'Agent',
            tabBarIcon: ({}) => <View />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
