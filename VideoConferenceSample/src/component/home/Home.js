import {useNavigation, useRoute} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  StringeeClient,
  StringeeClientListener,
  StringeeVideo,
} from 'stringee-react-native-v2';
import {CONFERCENE_SCREEN} from '../../utils';
import {createRoom} from '../../stringee/api';
import {generateRoomToken} from '../../utils/alg';
import {RoomManager} from '../../stringee/RoomManager';

const stringeeClient = new StringeeClient();

export const Home = () => {
  const token = useRoute().params.client;
  const rest = useRoute().params.rest;
  const [clientId, setClientId] = useState('');
  const [roomToken, setRoomToken] = useState(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDI2MjI4ODAsInJvb21JZCI6InJvb20tdm4tMS0xWktTSkk1RjFOLTE3MDE4ODA1NTk5MzgiLCJpc3MiOiJTS0UxUmRVdFVhWXhOYVFRNFdyMTVxRjF6VUp1UWRBYVZUIiwicGVybWlzc2lvbnMiOnsiY29udHJvbF9yb29tIjp0cnVlLCJzdWJzY3JpYmUiOnRydWUsInB1Ymxpc2giOnRydWV9LCJqdGkiOiJTS0UxUmRVdFVhWXhOYVFRNFdyMTVxRjF6VUp1UWRBYVZULTE3MDI1MzY0ODAxMTkifQ.OlxSAbWf7TGRHST2IJZVwaq4Ji8Vp9tXEOhNDp3ABNo',
  );
  const navigation = useNavigation();

  useEffect(() => {
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

  const didTapJoinRoom = () => {
    StringeeVideo.joinRoom(stringeeClient, roomToken)
      .then(({room, tracks, users}) => {
        RoomManager.instance.setRoom(room, tracks);
        navigation.navigate(CONFERCENE_SCREEN);
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
      <TouchableOpacity style={sheet.botton} onPress={didTapCreateRoom}>
        <Text style={sheet.textBtn}>create room</Text>
      </TouchableOpacity>
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
