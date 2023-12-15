import React, {useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {StringeeVideoView, StringeeVideoRoom} from 'stringee-react-native-v2';
import {RoomManager} from '../../stringee/RoomManager';
import {useNavigation, useRoute} from '@react-navigation/native';
import {CONFERCENE_SCREEN, chunk} from '../../utils';

const leaveIcon = require('../../../asset/leave.png');
const muteIcon = require('../../../asset/ic-mute-new.png');
const muteSelectedIcon = require('../../../asset/ic-mute-selected-new.png');
const switchCameraIcon = require('../../../asset/ic-switch-camera-new.png');
const videoIcon = require('../../../asset/ic-video-new.png');
const videoSelectedIcon = require('../../../asset/ic-video-selected-new.png');

export const RoomConference = () => {
  const [tracks, setTracks] = useState([]);
  const [mute, setMute] = useState(false);
  const [enableVideo, setEnableVideo] = useState(true);

  const navigation = useNavigation();

  useEffect(() => {
    RoomManager.instance.needUpdateDisplay = items => {
      setTracks([...items]);
    };
    RoomManager.instance.onLeave = () => {
      navigation.goBack();
    };
  }, []);

  const userOnRoom = (track, keyView) => {
    return (
      <View style={sheet.videoRoom} key={keyView}>
        <StringeeVideoView
          style={sheet.videoRoom}
          videoTrack={track}
          scalingType="fit"
        />
        <Text style={sheet.userInfo}>{track.publisher.userId}</Text>
      </View>
    );
  };

  useEffect(() => {
    console.log('useEffect', tracks.length);
  }, [tracks]);

  const mainRender = () => {
    return chunk(tracks).map((items, index) => {
      return (
        <View key={index} style={sheet.rows}>
          {items.map((item, key) => {
            return userOnRoom(item, key);
          })}
        </View>
      );
    });
  };

  return (
    <View style={sheet.main}>
      {mainRender()}
      <View style={sheet.buttomContainer}>
        <TouchableOpacity
          style={sheet.muteBtn}
          onPress={async () => {
            try {
              await RoomManager.instance.mute(!mute);
              setMute(!mute);
              console.log('mute ok');
            } catch (error) {
              console.log('mute', error);
            }
          }}>
          <Image
            style={sheet.muteBtn}
            source={!mute ? muteIcon : muteSelectedIcon}
          />
        </TouchableOpacity>
        <View style={sheet.space} />
        <TouchableOpacity
          style={sheet.swichCamera}
          onPress={async () => {
            try {
              await RoomManager.instance.switchCamera();
            } catch (error) {
              console.log(error);
            }
          }}>
          <Image style={sheet.muteBtn} source={switchCameraIcon} />
        </TouchableOpacity>
        <View style={sheet.space} />
        <TouchableOpacity
          style={sheet.enableVideoBtn}
          onPress={async () => {
            try {
              await RoomManager.instance.enableVideo(!enableVideo);
              setEnableVideo(!enableVideo);
            } catch (error) {
              console.log(error.message);
            }
          }}>
          <Image
            source={enableVideo ? videoIcon : videoSelectedIcon}
            style={sheet.muteBtn}
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={sheet.leftRoomButton}
        onPress={() => {
          Alert.alert(
            'Rời khỏi phòng',
            'Rời khỏi phòng ở thiết bị này hay tất cả các thiết bị',
            [
              {
                text: 'Rời khỏi phòng ở thiết bị này',
                onPress: async () => {
                  try {
                    await RoomManager.instance.leave(false);
                  } catch (error) {
                    console.log(error.message);
                  }
                },
              },
              {
                text: 'Rời khỏi phòng ở tất cả thiết bị',
                onPress: async () => {
                  try {
                    await RoomManager.instance.leave(true);
                  } catch (error) {
                    console.log(error.message);
                  }
                },
              },
            ],
          );
        }}>
        <Image source={leaveIcon} style={sheet.leave} />
      </TouchableOpacity>
    </View>
  );
};
const sheet = StyleSheet.create({
  videoRoom: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  avatar: {
    width: '50%',
    height: '50%',
  },
  userContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  rows: {
    flex: 1,
    flexDirection: 'row',
  },
  buttomContainer: {
    position: 'absolute',
    right: 40,
    left: 40,
    bottom: 100,
    height: 60,
    flexDirection: 'row',
  },
  leftRoomButton: {
    position: 'absolute',
    top: 100,
    right: 50,
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: 'while',
    borderRadius: 25,
  },

  muteBtn: {
    width: 60,
    height: 60,
  },

  swichCamera: {
    width: 60,
    height: 60,
  },
  leave: {
    width: 50,
    height: 50,
    backgroundColor: 'white'
  },
  space: {
    flex: 1,
  },
});
