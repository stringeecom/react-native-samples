import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { generateStringeeToken } from '../../utils';
import { useNavigation } from '@react-navigation/native';
import { HOME_SCREEN } from '../../utils';
import { generateRestApiToken } from '../../utils/alg';

export const Login = () => {
  const [userName, setUserName] = useState('');
  const navigation = useNavigation();
  const loginAction = async () => {
    try {
      const clientToken = await generateStringeeToken(userName);
      const restToken = await generateRestApiToken();

      navigation.navigate(HOME_SCREEN, {
        client: clientToken,
        rest: restToken,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={sheet.main}>
      <TextInput
        placeholder="Enter userId:"
        style={sheet.userInput}
        onChangeText={setUserName}
      />
      <TouchableOpacity style={sheet.button} onPress={loginAction}>
        <Text style={sheet.text}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const sheet = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInput: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'black',
    width: '80%',
    height: 50,
    padding: 16,
  },
  button: {
    width: '80%',
    height: 50,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'green',
  },
  text: { color: 'white', fontSize: 16 },
});
