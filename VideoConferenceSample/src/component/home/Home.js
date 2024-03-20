import {useNavigation, useRoute} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {
  PermissionsAndroid, Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  StringeeClient,
  StringeeClientListener,
  StringeeVideo,
} from 'stringee-react-native-v2';
import {CONFERENCE_SCREEN} from '../../utils';
import {createRoom} from '../../stringee/api';
import {generateRoomToken} from '../../utils/alg';
import {RoomManager} from '../../stringee/RoomManager';
import { each } from 'lodash';

const stringeeClient = new StringeeClient();

export const Home = () => {
  const token = useRoute().params.client;
  const rest = useRoute().params.rest;
  const [clientId, setClientId] = useState('');
  const [roomToken, setRoomToken] = useState(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJTS0UxUmRVdFVhWXhOYVFRNFdyMTVxRjF6VUp1UWRBYVZUIiwiZXhwIjoxNzEwOTk1MTE0LCJwZXJtaXNzaW9ucyI6eyJzdWJzY3JpYmUiOnRydWUsInB1Ymxpc2giOnRydWUsImNvbnRyb2xfcm9vbSI6dHJ1ZX0sInJvb21JZCI6InJvb20tdm4tMS0zUVpNSkVJUVNELTE3MTA3ODE1OTUyMjEiLCJqdGkiOiJTS0UxUmRVdFVhWXhOYVFRNFdyMTVxRjF6VUp1UWRBYVZULTE3MTA5MDg3MTQ4OTQifQ.aRSErk5B2KZSKlCgh96nUYgodohxsgvASniXi8m0bic',
  );
  const navigation = useNavigation();

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestPermission();
    }

    let listener = new StringeeClientListener();

    listener.onConnect = (client, userId) => {
      setClientId(userId);
      console.log(client.uuid);
    };
    listener.onDisConnect = _ => {
      setClientId('');
      console.log('onDisConnect');
    };
    listener.onFailWithError = (_, code, message) => {
      console.log(code, message);
    };
    stringeeClient.setListener(listener);
    stringeeClient.connect(token);
    console.log(token);
  }, []);

  const requestPermission = () => {
    new Promise((resolve, reject) => {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
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

  const didTapJoinRoom = () => {
    StringeeVideo.joinRoom(stringeeClient, roomToken)
      .then(({room, tracks, _}) => {
        RoomManager.instance.setRoom(room, tracks);
        navigation.navigate(CONFERENCE_SCREEN);
      })
      .catch(error => {
        console.log('Error', error);
      });
  };

  const didTapCreateRoom = async () => {
    try {
      let response = await (await createRoom(rest, `${Math.random()}`)).json();
      let roomId = response.roomId;
      let room = await generateRoomToken(roomId);
      console.log(room);
      setRoomToken(room);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={sheet.main}>
      <Text style={sheet.clientInfo}>
        {clientId ? 'userId - ' + clientId : 'DisConnect'}
      </Text>
      <TextInput
        style={sheet.roomInput}
        placeholder="Room Token:"
        onChangeText={setRoomToken}
        value={roomToken}
      />
      <TouchableOpacity style={sheet.botton} onPress={didTapJoinRoom}>
        <Text style={sheet.textBtn}>join room</Text>
      </TouchableOpacity>
      {/*<TouchableOpacity style={sheet.botton} onPress={didTapCreateRoom}>*/}
      {/*  <Text style={sheet.textBtn}>create room</Text>*/}
      {/*</TouchableOpacity>*/}
    </View>
  );
};

const sheet = StyleSheet.create({
  main: {
    flex: 1,
    alignItems: 'center',
  },
  clientInfo: {
    marginTop: '20%',
    fontSize: 20,
    fontWeight: 'bold',
  },
  roomInput: {
    padding: 16,
    margin: 20,
    width: '80%',
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'black',
  },
  botton: {
    width: 100,
    height: 50,
    backgroundColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBtn: {
    color: 'white',
  },
});
