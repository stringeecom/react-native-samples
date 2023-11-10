import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
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
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isMute, setIsMute] = useState(false);
  const [isOnCamera, setIsOnCamera] = useState(true);
  const [activeRemote, setActiveRemote] = useState(false);
  const [activeLocal, setActiveLocal] = useState(false);
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
    StringeeCallManager.instance.endSectionCall();
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
    }
    dispatch(setSignalState(SignalingState.calling));

    setIsSpeakerOn(callInfo.isVideo);

    StringeeCallManager.instance.didAnswer = () => {
      dispatch(setSignalState(SignalingState.answered));
    };

    StringeeCallManager.instance.registerEvent({
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
        setActiveRemote(true);
      },
      onReceiveLocalStream: () => {
        setActiveLocal(true);
      },
      onChangeMediaState: (_, mediaState, __) => {
        if (mediaState === MediaState.connected) {
          setMediaConnected(true);
        }
      },
      onHandleOnAnotherDevice: signalingState => {
        if (signalingState !== SignalingState.ringing) {
          clearDataAndGoBack();
        }
      },
    });
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
    StringeeCallManager.instance.enableVideo(
      !isOnCamera,
      (status, code, message) => {
        if (status) {
          setIsOnCamera(!isOnCamera);
        }
        console.log('enableVideo', status, code, message);
      },
    );
  };

  const endCallButton = () => {
    return (
      <TouchableOpacity
        style={{alignSelf: 'center', marginTop: '15%'}}
        onPress={() => {
          StringeeCallManager.instance.hangup((status, code, message) => {
            console.log('hangup: ', status, code, message);
          });
        }}>
        <Image source={icon.endCall} style={sheet.button_size} />
      </TouchableOpacity>
    );
  };

  const didTapMute = () => {
    StringeeCallManager.instance.mute(!isMute, (status, code, message) => {
      if (status) {
        setIsMute(!isMute);
      }
      console.log('mute', status, code, message);
    });
  };

  const didTapSpeaker = () => {
    StringeeCallManager.instance.enableSpeaker(
      !isSpeakerOn,
      (status, code, message) => {
        if (status) {
          setIsSpeakerOn(!isSpeakerOn);
        }
        console.log('enableSpeaker', status, code, message);
      },
    );
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
            StringeeCallManager.instance.switchCamera(
              (status, code, message) => {
                console.log('switchCamera', status, code, message);
              },
            );
          }}>
          <Image source={icon.cameraSwitch} style={sheet.button_size} />
        </TouchableOpacity>
        <TouchableOpacity
          style={sheet.stack_item_button}
          onPress={() => {
            StringeeCallManager.instance.hangup((status, code, message) => {
              console.log('end video call', status, code, message);
            });
          }}>
          <Image source={icon.endCall} style={sheet.button_size} />
        </TouchableOpacity>
      </View>
    );
  };

  const incomingCallButtonAction = () => {
    return (
      <View style={sheet.incoming_btn}>
        <TouchableOpacity
          onPress={() => {
            StringeeCallManager.instance.answer();
          }}>
          <Image source={icon.answer} style={{width: 70, height: 70}} />
        </TouchableOpacity>
        <View style={{flex: 1}} />
        <TouchableOpacity
          onPress={() => {
            StringeeCallManager.instance.rejectCall((status, code, message) => {
              console.log('reject call', status, code, message);
            });
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
            source={isSpeakerOn ? icon.speakerOff : icon.speakerOn}
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
      </View>
    );
  };

  const videoCallScreen = () => {
    return (
      <View style={{flex: 1}}>
        {activeRemote && (
          <StringeeVideoView
            callId={StringeeCallManager.instance.call.callId}
            local={false}
            scalingType={'fit'}
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
          callId={StringeeCallManager.instance.call.callId}
          local={true}
          scalingType={'fit'}
          overlay={true}
          style={
            // activeRemote ? sheet.local_view_did_active_remote : sheet.local_view
            sheet.local_view_did_active_remote
          }
        />
        {videoCallActionButton()}
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
});
