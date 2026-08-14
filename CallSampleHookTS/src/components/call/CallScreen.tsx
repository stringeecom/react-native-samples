import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  type ImageSourcePropType,
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
  StringeeVideoScalingType,
} from 'stringee-react-native-v2';
import type {
  StringeeVideoTrack,
  StringeeVideoViewProps,
} from 'stringee-react-native-v2';
import {HOME_SCREEN_NAME} from '../../const';
import {StringeeWrapper} from '../../stringee_wrapper';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList, RootState} from '../../types';

const height = Dimensions.get('window').height;
const width = Dimensions.get('window').width;
// The linked SDK is built with React 19 while this RN 0.72 sample uses React
// 18. Cast only the component surface so application props remain checked.
const VideoView =
  StringeeVideoView as unknown as React.ComponentType<StringeeVideoViewProps>;
const CallScreen = () => {
  const callInfo = useSelector((state: RootState) => state.stringee.call);
  const signalState = useSelector(
    (state: RootState) => state.stringee.signalState,
  );
  const [duration, setDuration] = useState(0);
  const [mediaConnected, setMediaConnected] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isMute, setIsMute] = useState(false);
  const [isOnCamera, setIsOnCamera] = useState(true);
  const [remoteStreamReady, setRemoteStreamReady] = useState(false);
  const [localStreamReady, setLocalStreamReady] = useState(false);
  const [remoteTrack, setRemoteTrack] = useState<StringeeVideoTrack | null>(
    null,
  );
  const [localTrack, setLocalTrack] = useState<StringeeVideoTrack | null>(null);
  const dispatch = useDispatch();

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    setupCall();
    return () => {
      StringeeCallManager.instance.finishSystemCallUI();
    };
    // A call session is initialized once for this screen instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mediaConnected) {
      return undefined;
    }
    const timer = setInterval(() => {
      setDuration(currentDuration => currentDuration + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [mediaConnected]);

  const clearDataAndGoBack = (): void => {
    StringeeCallManager.instance.endCallSection();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(HOME_SCREEN_NAME);
    }
  };

  const setupCall = (): void => {
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
        setRemoteStreamReady(true);
      },
      onReceiveLocalStream: () => {
        setLocalStreamReady(true);
      },
      onReceiveLocalTrack: track => {
        setLocalTrack(track);
      },
      onReceiveRemoteTrack: track => {
        setRemoteTrack(track);
      },

      onChangeMediaState: (_, mediaState) => {
        if (mediaState === MediaState.connected) {
          setMediaConnected(true);
          StringeeCallManager.instance
            .enableSpeaker(callInfo.isVideo)
            .catch(console.log);
        }
      },
      onHandleOnAnotherDevice: signalingState => {
        if (signalingState !== SignalingState.ringing) {
          clearDataAndGoBack();
        }
      },
    };

    if (!callInfo.isIncoming) {
      dispatch(setSignalState(SignalingState.calling));
      StringeeWrapper.instance
        .makeCall({
          to: callInfo.call_with,
          isVideoCall: callInfo.isVideo,
          useCall2: callInfo.useCall2,
        })
        .catch(error => {
          console.log('Unable to make call', error);
          clearDataAndGoBack();
        });
    } else {
      dispatch(setSignalState(SignalingState.ringing));
    }

    setIsSpeakerOn(callInfo.isVideo);
  };

  const duration2time = (time: number): string => {
    let seconds = (time % 60).toString();
    let minutes = Math.floor(time / 60).toString();

    if (minutes.length === 1) {
      minutes = '0' + minutes;
    }
    if (seconds.length === 1) {
      seconds = '0' + seconds;
    }
    return `${minutes}:${seconds}`;
  };

  const didTapCamera = (): void => {
    StringeeCallManager.instance.enableVideo(!isOnCamera);
    setIsOnCamera(!isOnCamera);
  };

  const didTapMute = (): void => {
    StringeeCallManager.instance.mute(!isMute);
    setIsMute(!isMute);
  };

  const didTapSpeaker = (): void => {
    StringeeCallManager.instance.enableSpeaker(!isSpeakerOn);
    setIsSpeakerOn(!isSpeakerOn);
  };

  const renderActionButton = (
    source: ImageSourcePropType,
    label: string,
    onPress: () => void,
    active = false,
  ): React.ReactElement => {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[sheet.actionButton, active && sheet.actionButtonActive]}
        onPress={onPress}>
        <Image source={source} style={sheet.actionIcon} resizeMode="contain" />
      </TouchableOpacity>
    );
  };

  const renderAvatar = (): React.ReactElement => {
    const initial = callInfo.call_with?.trim().charAt(0).toUpperCase() || '';
    return (
      <View style={sheet.avatarBorder}>
        <View style={sheet.avatar}>
          <Text style={sheet.avatarText}>{initial}</Text>
        </View>
      </View>
    );
  };

  const renderCallHeader = (showDuration = false): React.ReactElement => {
    return (
      <View style={sheet.headerRow}>
        <View style={sheet.headerCopy}>
          <Text style={sheet.statusText}>{signalState}</Text>
          <View style={sheet.statusDivider} />
          <Text style={sheet.calleeText}>{callInfo.call_with}</Text>
        </View>
        {showDuration && (
          <View style={sheet.voiceDuration}>
            <Text style={sheet.durationText}>{duration2time(duration)}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderRingingActions = (): React.ReactElement => {
    return (
      <View style={sheet.bottomActions}>
        {callInfo.isIncoming ? (
          <View style={sheet.actionRow}>
            {renderActionButton(icon.endCall, 'Reject call', () => {
              StringeeCallManager.instance.rejectCall();
            })}
            {renderActionButton(icon.answer, 'Answer call', () => {
              StringeeCallManager.instance.answer();
            })}
          </View>
        ) : (
          renderActionButton(icon.endCall, 'End call', () => {
            StringeeCallManager.instance.hangup();
          })
        )}
      </View>
    );
  };

  const renderRingingScreen = (): React.ReactElement => {
    return (
      <View style={sheet.screen}>
        <View style={sheet.callBody}>
          {renderCallHeader()}
          <View style={sheet.avatarCenter}>{renderAvatar()}</View>
        </View>
        {renderRingingActions()}
      </View>
    );
  };

  const renderVoiceCall = (): React.ReactElement => {
    return (
      <View style={sheet.screen}>
        <View style={[sheet.callBody, sheet.voiceCallBody]}>
          <View style={sheet.voiceHeaderArea}>{renderCallHeader(true)}</View>
          {renderAvatar()}
          <View style={sheet.voiceSpacer} />
          <View style={sheet.voiceControls}>
            {renderActionButton(
              isSpeakerOn ? icon.speakerOff : icon.speakerOn,
              'Toggle audio route',
              didTapSpeaker,
              isSpeakerOn,
            )}
            {renderActionButton(
              isMute ? icon.unMute : icon.mute,
              isMute ? 'Unmute microphone' : 'Mute microphone',
              didTapMute,
              isMute,
            )}
          </View>
        </View>
        <View style={sheet.bottomActions}>
          {renderActionButton(icon.endCall, 'End call', () => {
            StringeeCallManager.instance.hangup();
          })}
        </View>
      </View>
    );
  };

  const renderVideoCall = (): React.ReactElement => {
    return (
      <View style={sheet.videoScreen}>
        {(remoteStreamReady || remoteTrack) && (
          <VideoView
            uuid={StringeeCallManager.instance.call?.uuid}
            local={false}
            scalingType={StringeeVideoScalingType.fit}
            videoTrack={remoteTrack}
            style={sheet.remoteVideo}
          />
        )}
        {!remoteStreamReady && !remoteTrack && (
          <View style={sheet.remotePlaceholder} />
        )}
        <View style={sheet.videoDuration}>
          <Text style={sheet.durationText}>{duration2time(duration)}</Text>
        </View>
        <View style={sheet.localPreview}>
          {(localStreamReady || localTrack) && (
            <VideoView
              uuid={StringeeCallManager.instance.call?.uuid}
              local={true}
              scalingType={StringeeVideoScalingType.fit}
              videoTrack={localTrack}
              style={sheet.localVideo}
            />
          )}
          {!localStreamReady && !localTrack && (
            <View style={sheet.localPlaceholder} />
          )}
        </View>
        <View style={sheet.videoActions}>
          {renderActionButton(
            isOnCamera ? icon.cameraOn : icon.cameraOff,
            isOnCamera ? 'Turn camera off' : 'Turn camera on',
            didTapCamera,
            !isOnCamera,
          )}
          {renderActionButton(
            isMute ? icon.unMute : icon.mute,
            isMute ? 'Unmute microphone' : 'Mute microphone',
            didTapMute,
            isMute,
          )}
          {renderActionButton(icon.cameraSwitch, 'Switch camera', () => {
            StringeeCallManager.instance.switchCamera();
          })}
          {renderActionButton(icon.endCall, 'End call', () => {
            StringeeCallManager.instance.hangup();
          })}
        </View>
      </View>
    );
  };

  if (!mediaConnected) {
    return renderRingingScreen();
  }
  if (callInfo.isVideo) {
    return renderVideoCall();
  }
  return renderVoiceCall();
};

export default CallScreen;

const sheet = StyleSheet.create({
  screen: {flex: 1, backgroundColor: 'white'},
  callBody: {
    flex: 3,
    paddingTop: 64,
    backgroundColor: '#1A578D',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerCopy: {paddingHorizontal: 16, flexShrink: 1},
  statusText: {color: 'rgba(255,255,255,0.7)', fontSize: 15},
  statusDivider: {
    marginTop: 5,
    width: 20,
    height: 2,
    backgroundColor: '#40B649',
  },
  calleeText: {marginTop: 15, color: 'white', fontSize: 22},
  avatarCenter: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  avatarBorder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: '#40B649',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {color: 'white', fontSize: 50},
  bottomActions: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  actionRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {backgroundColor: 'rgba(255,255,255,0.35)'},
  actionIcon: {width: 60, height: 60},
  voiceDuration: {
    width: 55,
    height: 30,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    backgroundColor: '#40B649',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {color: 'white', fontSize: 12, fontWeight: '600'},
  voiceCallBody: {paddingBottom: 40, alignItems: 'center'},
  voiceHeaderArea: {flex: 1, width: '100%'},
  voiceSpacer: {flex: 1},
  voiceControls: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  videoScreen: {flex: 1, backgroundColor: 'black'},
  remoteVideo: {width, height, backgroundColor: 'black'},
  remotePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  videoDuration: {
    position: 'absolute',
    top: 64,
    left: 16,
    width: 55,
    height: 30,
    borderRadius: 5,
    backgroundColor: '#40B649',
    alignItems: 'center',
    justifyContent: 'center',
  },
  localPreview: {
    position: 'absolute',
    top: 64,
    right: 16,
    width: 110,
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'black',
  },
  localVideo: {width: 110, height: 150},
  localPlaceholder: {flex: 1, backgroundColor: 'black'},
  videoActions: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
});
