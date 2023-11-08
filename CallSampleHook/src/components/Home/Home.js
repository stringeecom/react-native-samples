import React, {useEffect, useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  PermissionsAndroid,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {setCallInfo, setClientInfo} from '../../redux/actions';
import clientManager from '../../stringee_manager/StringeeClientManager';
import StringeeCallManager from '../../stringee_manager/StringeeCallManager';
import {useNavigation} from '@react-navigation/native';
import {
  ANSWER_ACTION_ID,
  CALL_SCREEN_NAME,
  isIos,
  NOTIFICATION_ID,
} from '../../const';
import {each} from 'underscore';
import notifee from '@notifee/react-native';
import {StringeeClientListener} from 'stringee-react-native-v2';

const stringee_token =
  'eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTS0UxUmRVdFVhWXhOYVFRNFdyMTVxRjF6VUp1UWRBYVZULTE2OTgxMjE1NzYiLCJpc3MiOiJTS0UxUmRVdFVhWXhOYVFRNFdyMTVxRjF6VUp1UWRBYVZUIiwiZXhwIjoxNzAwNzEzNTc2LCJ1c2VySWQiOiJpb3MxIn0.0zF25tvsW_A9SPuK_dxU5r_MbLxPU-gJ6UBmd-rACg8';
//const stringee_token =
//  'eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTS0UxUmRVdFVhWXhOYVFRNFdyMTVxRjF6VUp1UWRBYVZULTE2OTgxMjE1ODUiLCJpc3MiOiJTS0UxUmRVdFVhWXhOYVFRNFdyMTVxRjF6VUp1UWRBYVZUIiwiZXhwIjoxNzAwNzEzNTg1LCJ1c2VySWQiOiJpb3MyIn0.vbcvhaRLynS7DdLeZqfocxh_qaAQpZ-L7D7THROdnjw';
const HomeScreen = () => {
  const [callWith, setCallWith] = useState('');
  const isOnline = useSelector(state => state.stringee.client.isOnline);
  const clientId = useSelector(state => state.stringee.client.client_id);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  /**
   * handle press action from notification when app is killed
   */
  async function bootstrap() {
    const initialNotification = await notifee.getInitialNotification();
    if (initialNotification && StringeeCallManager.instance.call) {
      console.log(
        'initialNotification - ' +
          JSON.stringify(initialNotification.pressAction),
      );
      if (initialNotification.pressAction) {
        dispatch(
          setCallInfo({
            call_with: StringeeCallManager.instance.call.from,
          }),
        );
        navigation.navigate(CALL_SCREEN_NAME);
        if (initialNotification.pressAction.id === ANSWER_ACTION_ID) {
          StringeeCallManager.instance.answer((status, _, __) => {
            if (StringeeCallManager.instance.didAns && status) {
              StringeeCallManager.instance.didAns();
            }
          });
        }
      }
    } else {
      // Handle when app open in fullscreen mode
      if (StringeeCallManager.instance.call) {
        dispatch(
          setCallInfo({
            call_with: StringeeCallManager.instance.call.from,
          }),
        );
        navigation.navigate(CALL_SCREEN_NAME);
      }
    }
    await notifee.cancelNotification(NOTIFICATION_ID);
  }

  useEffect(() => {
    if (!isIos) {
      requestPermission();
      bootstrap().then(r => {
        console.log(r);
      });
    }
    if (clientManager.instance.client.userId !== undefined) {
      dispatch(
        setClientInfo({
          isOnline: clientManager.instance.isConnected,
          client_id: clientManager.instance.client.userId,
        }),
      );
    }

    clientManager.instance.connect(stringee_token);

    clientManager.instance.listenner = new StringeeClientListener();

    clientManager.instance.listenner.onConnect = (_, id) => {
      console.log(id);
      dispatch(setClientInfo({isOnline: true, client_id: id}));
    };

    clientManager.instance.listenner.onDisConnect = _ => {
      dispatch(setClientInfo({isOnline: false, clientId: clientId}));
    };

    clientManager.instance.listenner.onIncomingCall = (_, call) => {
      dispatch(
        setCallInfo({
          call_with: call.from,
        }),
      );
      navigation.navigate(CALL_SCREEN_NAME);
    };
    clientManager.instance.listenner.onIncomingCall2 = (_, call) => {
      dispatch(
        setCallInfo({
          call_with: call.from,
        }),
      );
      navigation.navigate(CALL_SCREEN_NAME);
    };
  }, []);

  const requestPermission = () => {
    new Promise((resolve, reject) => {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS, // Need this permission for android 13 or higher
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, // Need this permission for android 12 or higher
      ])
        .then(result => {
          const permissionsError = {};
          permissionsError.permissionsDenied = [];
          each(result, (permissionValue, permissionType) => {
            if (permissionValue === 'denied') {
              permissionsError.permissionsDenied.push(permissionType);
              permissionsError.type = 'Permissions error';
            }
          });
          if (permissionsError.permissionsDenied.length > 0) {
            reject(permissionsError);
          } else {
            resolve();
          }
        })
        .catch(error => {
          reject(error);
        });
    }).then();
  };
  const makeCall = isVideo => {
    StringeeCallManager.instance.initializeCall(callWith, isVideo);
    dispatch(
      setCallInfo({
        call_with: callWith,
      }),
    );
    navigation.navigate(CALL_SCREEN_NAME);
  };

  const makeCall2 = isVideo => {
    StringeeCallManager.instance.initializeCall2(callWith, isVideo);
    dispatch(
      setCallInfo({
        call_with: callWith,
      }),
    );
    navigation.navigate(CALL_SCREEN_NAME);
  };

  const CallButtonView = () => {
    return (
      <View style={style.callSection}>
        <TouchableOpacity
          style={style.callButton}
          onPress={() => {
            makeCall(false);
          }}>
          <Text style={{color: 'white', fontWeight: '600'}}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={style.callButton}
          onPress={() => {
            makeCall(true);
          }}>
          <Text style={{color: 'white', fontWeight: '600'}}>Video Call</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const Call2ButtonView = () => {
    return (
      <View style={style.callSection}>
        <TouchableOpacity
          style={style.callButton}
          onPress={() => {
            makeCall2(false);
          }}>
          <Text style={{color: 'white', fontWeight: '600'}}>Call2</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={style.callButton}
          onPress={() => {
            makeCall2(true);
          }}>
          <Text style={{color: 'white', fontWeight: '600'}}>Video Call2</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
      }}>
      <Text
        style={{
          marginTop: 200,
          color: 'black',
          fontSize: 20,
          marginBottom: 16,
        }}>
        {isOnline ? 'connected - ' + clientId : 'disconnected'}
      </Text>
      <TextInput
        placeholder="to userID: "
        placeholderTextColor={'gray'}
        style={style.textInputStyle}
        value={callWith}
        onChangeText={setCallWith}
      />
      <CallButtonView />
      <Call2ButtonView />
    </View>
  );
};

export default HomeScreen;

const style = StyleSheet.create({
  callButton: {
    width: '40%',
    height: '100%',
    backgroundColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: '5%',
  },
  callSection: {
    width: '90%',
    flexDirection: 'row',
    marginVertical: 16,
    height: 40,
  },
  textInputStyle: {
    borderColor: 'gray',
    borderRadius: 16,
    borderWidth: 1,
    width: '90%',
    height: 50,
    marginVertical: 16,
    padding: 10,
  },
});
