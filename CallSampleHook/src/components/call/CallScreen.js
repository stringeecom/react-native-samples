import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import icon from '../../../assets/icon';
import StringeeCallManager from '../../stringee_manager/StringeeCallManager';
import {useNavigation} from '@react-navigation/native';
import {setSignalState} from '../../redux/actions';
import {
  SignalingState,
  StringeeVideoView,
  MediaState,
  AudioType,
} from 'stringee-react-native-v2';
import {HOME_SCREEN_NAME} from '../../const';
import RNCallKeep from 'react-native-callkeep';

const height = Dimensions.get('window').height;
const width = Dimensions.get('window').width;
const CallScreen = () => {
  const callInfo = useSelector(state => state.stringee.call);
  const signalState: SignalingState = useSelector(
    state => state.stringee.signalState,
  );
  const [duration, setDuration] = useState(0);
  const [mediaConnected, setMediaConnected] = useState(false);
  const [audioDevice, setAudioDevice] = useState(null);
  const [isMute, setIsMute] = useState(false);
  const [isOnCamera, setIsOnCamera] = useState(true);
  const [remoteTrack, setRemoteTrack] = useState(null);
  const [localTrack, setLocalTrack] = useState(null);
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();

  const navigation = useNavigation();

  useEffect(() => {
    setupCall();
    return () => {
      RNCallKeep.endAllCalls();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      if (mediaConnected) {
        setDuration(duration + 1);
      }
    }, 1000);
  }, [duration, mediaConnected]);

  const clearDataAndGoBack = () => {
    StringeeCallManager.instance.endCallSection();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(HOME_SCREEN_NAME);
    }
  };

  const setupCall = () => {
    if (!callInfo.isIncoming) {
      if (callInfo.useCall2) {
        StringeeCallManager.instance.makeCall2(
          callInfo.call_with,
          callInfo.isVideo,
        );
      } else {
        StringeeCallManager.instance.makeCall(
          callInfo.call_with,
          callInfo.isVideo,
        );
      }
      dispatch(setSignalState(SignalingState.calling));
    } else {
      dispatch(setSignalState(SignalingState.ringing));
    }

    StringeeCallManager.instance.didAnswer = () => {
      dispatch(setSignalState(SignalingState.answered));
    };

    StringeeCallManager.instance.events = {
      onChangeSignalingState: signalingState => {
        if (
          signalingState === SignalingState.busy ||
          signalingState === SignalingState.ended
        ) {
          clearDataAndGoBack();
        }
        dispatch(setSignalState(signalingState));
      },
      onReceiveRemoteStream: () => {
        if (remoteTrack == null) {
          setRemoteTrack({});
        }
      },
      onReceiveLocalStream: () => {
        if (localTrack == null) {
          setLocalTrack({});
        }
      },
      onReceiveLocalTrack: track => {
        setLocalTrack(track);
      },
      onReceiveRemoteTrack: track => {
        setRemoteTrack(track);
      },

      onChangeMediaState: (_, mediaState, __) => {
        if (mediaConnected === false && mediaState === MediaState.connected) {
          StringeeCallManager.instance.enableSpeaker(callInfo.isVideo);
        }

        if (mediaState === MediaState.connected) {
          setMediaConnected(true);
        }
      },
      onHandleOnAnotherDevice: signalingState => {
        if (signalingState !== SignalingState.ringing) {
          clearDataAndGoBack();
        }
      },
      onAudioDeviceChange: device => {
        setAudioDevice(device);
      },
    };
  };

  const duration2time = time => {
    let m = (time % 60).toString();
    let h = ((time - m) / 60).toFixed(0).toString();

    if (h.length === 1) {
      h = '0' + h;
    }
    if (m.length === 1) {
      m = '0' + m;
    }
    return `${h}:${m}`;
  };

  const didTapCamera = () => {
    StringeeCallManager.instance.enableVideo(!isOnCamera);
    setIsOnCamera(!isOnCamera);
  };

  const endCallButton = () => {
    return (
      <TouchableOpacity
        style={{alignSelf: 'center', marginTop: '15%'}}
        onPress={() => {
          StringeeCallManager.instance.hangup();
        }}>
        <Image source={icon.endCall} style={sheet.button_size} />
      </TouchableOpacity>
    );
  };

  const didTapMute = () => {
    StringeeCallManager.instance.mute(!isMute);
    setIsMute(!isMute);
  };

  const didTapSpeaker = () => {
    if (StringeeCallManager.instance.availableAudioDevices.length < 3) {
      if (StringeeCallManager.instance.availableAudioDevices.length <= 1) {
        return;
      }
      let position =
        StringeeCallManager.instance.availableAudioDevices.indexOf(audioDevice);
      if (
        position ===
        StringeeCallManager.instance.availableAudioDevices.length - 1
      ) {
        StringeeCallManager.instance.selectDevice(
          StringeeCallManager.instance.availableAudioDevices[0],
        );
      } else {
        StringeeCallManager.instance.selectDevice(
          StringeeCallManager.instance.availableAudioDevices[position + 1],
        );
      }
    } else {
      setVisible(true);
    }
  };

  const videoCallActionButton = () => {
    return (
      <View style={sheet.video_call_button_section}>
        <TouchableOpacity
          style={sheet.stack_item_button}
          onPress={didTapCamera}>
          <Image
            source={isOnCamera ? icon.cameraOn : icon.cameraOff}
            style={sheet.button_size}
          />
        </TouchableOpacity>
        <TouchableOpacity style={sheet.stack_item_button} onPress={didTapMute}>
          <Image
            source={isMute ? icon.unMute : icon.mute}
            style={sheet.button_size}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={sheet.stack_item_button}
          onPress={() => {
            StringeeCallManager.instance.switchCamera();
          }}>
          <Image source={icon.cameraSwitch} style={sheet.button_size} />
        </TouchableOpacity>
        <TouchableOpacity
          style={sheet.stack_item_button}
          onPress={() => {
            StringeeCallManager.instance.hangup();
          }}>
          <Image source={icon.endCall} style={sheet.button_size} />
        </TouchableOpacity>
      </View>
    );
  };

  const selectAudioDevicePopup = () => {
    return (
      <Modal transparent visible={visible}>
        <TouchableOpacity
          style={sheet.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}>
          <View style={sheet.sheet}>
            {StringeeCallManager.instance.availableAudioDevices.map(
              (item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    StringeeCallManager.instance.selectDevice(
                      StringeeCallManager.instance.availableAudioDevices[index],
                    );
                    setVisible(false);
                  }}>
                  <Text style={sheet.option}>{item}</Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const incomingCallButtonAction = () => {
    return (
      <View style={sheet.incoming_btn}>
        <TouchableOpacity
          onPress={() => {
            StringeeCallManager.instance.answer().then().catch(console.log);
          }}>
          <Image source={icon.answer} style={{width: 70, height: 70}} />
        </TouchableOpacity>
        <View style={{flex: 1}} />
        <TouchableOpacity
          onPress={() => {
            if (callInfo.isIncoming) {
              StringeeCallManager.instance.rejectCall();
            } else {
              StringeeCallManager.instance.hangup();
            }
          }}>
          <Image source={icon.endCall} style={{width: 70, height: 70}} />
        </TouchableOpacity>
      </View>
    );
  };

  const incomingCallView = () => {
    return (
      <View style={{flex: 1, alignItems: 'center'}}>
        <View style={{flex: 1}} />
        <Text style={{color: 'gray'}}>Cuộc gọi đến</Text>
        <View style={{...sheet.border_view, marginLeft: null}} />
        <Text style={{...sheet.call_info_name, marginBottom: 30}}>
          {callInfo.call_with}
        </Text>
      </View>
    );
  };

  const callActionButton = () => {
    if (signalState === SignalingState.ringing && callInfo.isIncoming) {
      return <View />;
    }

    return (
      <View style={{marginBottom: 30, flexDirection: 'row'}}>
        <TouchableOpacity style={{marginLeft: 80}} onPress={didTapMute}>
          <Image
            source={isMute ? icon.unMute : icon.mute}
            style={sheet.button_size}
          />
        </TouchableOpacity>
        <View style={{flex: 1}} />
        <TouchableOpacity style={{marginRight: 80}} onPress={didTapSpeaker}>
          <Image
            source={
              audioDevice.type === AudioType.speakerPhone
                ? icon.speakerOff
                : icon.speakerOn
            }
            style={sheet.button_size}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const callInfoView = () => {
    return (
      <View
        style={{
          marginBottom: 0,
          width: '100%',
          flexDirection: 'row',
        }}>
        <View style>
          <Text style={{color: 'gray', marginLeft: 5}}>{signalState}</Text>
          <View style={sheet.border_view} />
          <Text style={sheet.call_info_name}>{callInfo.call_with}</Text>
        </View>
        <View style={{flex: 1}} />
        <View>
          <View style={{flex: 1}} />
          {mediaConnected && (
            <View style={sheet.time_duration}>
              <Text style={{color: 'white', fontWeight: '600'}}>
                {duration2time(duration)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const footerNormalCall = () => {
    if (
      callInfo.isIncoming &&
      (signalState === SignalingState.ringing ||
        signalState === SignalingState.calling)
    ) {
      return incomingCallButtonAction();
    }
    return endCallButton();
  };

  const normalCallScreen = () => {
    return (
      <View style={{flex: 1}}>
        <View style={sheet.call_info_view}>
          <View style={{flex: 1, flexDirection: 'column-reverse'}}>
            {(!callInfo.isIncoming || signalState !== SignalingState.ringing) &&
              callInfoView()}
          </View>
          <View style={{flex: 3}}>
            <View style={{flex: 1}}>
              {callInfo.isIncoming &&
                signalState === SignalingState.ringing &&
                incomingCallView()}
            </View>
            <View style={{flex: 2}}>
              <View style={sheet.circle_avatar_view}>
                <Text
                  style={{fontSize: 28, fontWeight: 'bold', color: 'white'}}>
                  {callInfo.call_with.charAt(0)}
                </Text>
              </View>
              <View style={{flex: 1}} />
              {callActionButton()}
            </View>
          </View>
        </View>
        <View style={{flex: 2, backgroundColor: 'white'}}>
          {footerNormalCall()}
        </View>
        {selectAudioDevicePopup()}
      </View>
    );
  };

  const videoCallScreen = () => {
    return (
      <View style={{flex: 1}}>
        {remoteTrack && (
          <StringeeVideoView
            uuid={StringeeCallManager.instance.call.uuid}
            local={false}
            scalingType={'fit'}
            videoTrack={remoteTrack}
            style={{
              flex: 1,
              width: width,
              height: height,
              backgroundColor: 'black',
            }}
            overlay={false}
          />
        )}
        {mediaConnected && (
          <View
            style={{
              ...sheet.time_duration,
              position: 'absolute',
              top: 150,
              right: 0,
            }}>
            <Text style={{color: 'white', fontWeight: '600'}}>
              {duration2time(duration)}
            </Text>
          </View>
        )}
        <StringeeVideoView
          uuid={StringeeCallManager.instance.call.uuid}
          local={true}
          scalingType={'fit'}
          overlay={true}
          videoTrack={localTrack}
          style={sheet.local_view_did_active_remote}
        />
        {videoCallActionButton()}
        {selectAudioDevicePopup()}
      </View>
    );
  };

  const mainRender = () => {
    if (callInfo.isVideo && mediaConnected) {
      return videoCallScreen();
    }
    return normalCallScreen();
  };
  return mainRender();
};

export default CallScreen;

const sheet = StyleSheet.create({
  border_view: {
    marginLeft: 5,
    width: 30,
    height: 2,
    backgroundColor: '#66D54B',
    marginTop: 8,
  },
  call_info_name: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginLeft: 5,
  },
  time_duration: {
    padding: 8,
    paddingRight: 15,
    backgroundColor: '#66D54B',
    borderTopStartRadius: 5,
    borderBottomStartRadius: 5,
  },
  call_info_view: {
    flex: 5,
    backgroundColor: '#082E53',
    borderBottomEndRadius: 16,
    borderBottomStartRadius: 16,
  },

  circle_avatar_view: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    backgroundColor: 'green',
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 60,
  },

  button_size: {
    width: 60,
    height: 60,
  },

  incoming_btn: {
    height: 60,
    flexDirection: 'row',
    marginHorizontal: 60,
    marginTop: '15%',
  },

  video_call_button_section: {
    justifyContent: 'center',
    position: 'absolute',
    width: '100%',
    height: 200,
    bottom: 0,
    flexDirection: 'row',
  },

  stack_item_button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  local_view: {
    flex: 1,
    backgroundColor: 'blue',
  },

  local_view_did_active_remote: {
    position: 'absolute',
    width: 150,
    height: 200,
    top: 50,
    left: 16,
    zIndex: 2,
  },

  overlay: {
    flex: 1,
    backgroundColor: '#00000044',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 24,
  },
  option: {
    paddingVertical: 16,
    fontSize: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
});
