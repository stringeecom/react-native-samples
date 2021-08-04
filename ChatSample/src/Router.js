

import React from 'react';

import {StackNavigator} from 'react-navigation'

import HomeScreen from "./HomeScreen";

export const RootStack = StackNavigator (
    {
      Home: {
        screen: HomeScreen,
        navigationOptions: {
          header: null
        }
      }
    },
    {
      initialRouteName: 'Home',
    }
)