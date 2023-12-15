import React from 'react';
import {} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import {LOGIN_SCREEN} from '../../utils';
import {Home, Login, RoomConference} from '..';
import {CONFERCENE_SCREEN, HOME_SCREEN} from '../../utils/constant';

const Stack = createNativeStackNavigator();

export const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name={LOGIN_SCREEN} component={Login} />
        <Stack.Screen name={HOME_SCREEN} component={Home} />
        <Stack.Screen name={CONFERCENE_SCREEN} component={RoomConference} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
