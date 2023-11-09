import AsyncStorage from '@react-native-async-storage/async-storage';
import {KEY_PUSH_REGISTERED} from '../const';

export const getRegisterStatus = async () => {
  try {
    const value = await AsyncStorage.getItem(KEY_PUSH_REGISTERED);
    return JSON.parse(value);
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

export const saveRegisterState = async (value: boolean) => {
  try {
    console.log(JSON.stringify(value));
    return await AsyncStorage.setItem(
      KEY_PUSH_REGISTERED,
      JSON.stringify(value),
    );
  } catch (e) {
    console.log(e);
  }
};
