import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Alert,
  Dimensions,
} from 'react-native';

import {Icon} from 'react-native-elements';
import {StringeeVideoView} from 'stringee-react-native/src/StringeeVideoView';
import {StringeeCall} from 'stringee-react-native';

const height = Dimensions.get('window').height;
const width = Dimensions.get('window').width;

export default class CallScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      callId:
        props.route.params.callId !== undefined
          ? props.route.params.callId
          : '',
      clientId: props.route.params.clientId,
      from: props.route.params.from,
      to: props.route.params.to,
      isVideoCall: props.route.params.isVideoCall,
      isIncoming: props.route.params.isIncoming,

      isMute: false,
      isVideoEnable: props.route.params.isVideoCall,
      isSpeaker: props.route.params.isVideoCall,
      showAnswerBtn: props.route.params.isIncoming,
      receivedLocalStream: false,
      receivedRemoteStream: false,

      signalingState: -1,
      mediaState: -1,
    };
    this.call = React.createRef();
    this.callEvents = {
      onChangeSignalingState: this.callDidChangeSignalingState,
      onChangeMediaState: this.callDidChangeMediaState,
      onReceiveLocalStream: this.callDidReceiveLocalStream,
      onReceiveRemoteStream: this.callDidReceiveRemoteStream,
      onReceiveCallInfo: this.didReceiveCallInfo,
      onHandleOnAnotherDevice: this.didHandleOnAnotherDevice,
      onAudioDeviceChange: this.didAudioDeviceChange, ///only available on android
    };
  }

  componentDidMount(): void {
    // InitAnswer
    if (this.state.isIncoming) {
      this.call.current.initAnswer(
        this.state.callId,
        (status, code, message) => {
          console.log('initAnswer ' + message);
        },
      );
    }
    // Make new call
    else {
      const callParams = JSON.stringify({
        from: this.state.from,
        to: this.state.to,
        isVideoCall: this.state.isVideoCall,
        videoResolution: 'NORMAL',
      });

      this.call.current.makeCall(
        callParams,
        (status, code, message, callId) => {
          console.log(
            'status-' +
              status +
              ' code-' +
              code +
              ' message-' +
              message +
              ' callId-' +
              callId,
          );
          if (status) {
            this.setState({
              callId: callId,
              status: 'Outgoing Call',
            });
          } else {
            Alert.alert('Make call fail: ' + message);
          }
        },
      );
    }
  }

  /// MARK: - CALL EVENT HANDLER
  // Invoked when the call signaling state changes
  callDidChangeSignalingState = ({
    callId,
    code,
    reason,
    sipCode,
    sipReason,
  }) => {
    console.log(
      'callDidChangeSignalingState ' +
        '\ncallId-' +
        callId +
        '\ncode-' +
        code +
        '\nreason-' +
        reason +
        '\nsipCode-' +
        sipCode +
        '\nsipReason-' +
        sipReason,
    );

    this.setState({
      status: reason,
      signalingState: code,
    });

    switch (code) {
      case 0:
        // Calling
        break;
      case 1:
        // Ringing
        break;
      case 2:
        // Answered
        if (this.state.mediaState === 0 && this.state.status !== 'started') {
          this.startCall();
        }
        break;
      case 3:
        // Busy
        this.endPress(true);
        break;
      case 4:
        // Ended
        this.endPress(true);
        break;
    }
  };

  // Invoked when the call media state changes
  callDidChangeMediaState = ({callId, code, description}) => {
    console.log(
      'callDidChangeMediaState' +
        ' callId-' +
        callId +
        'code-' +
        code +
        ' description-' +
        description,
    );
    this.setState({
      mediaState: code,
    });
    switch (code) {
      case 0:
        if (
          this.state.signalingState === 2 &&
          this.state.status !== 'started'
        ) {
          this.startCall();
        }
        break;
      case 1:
        break;
    }
  };

  // Invoked when the local stream is available
  callDidReceiveLocalStream = ({callId}) => {
    console.log('callDidReceiveLocalStream');
    this.setState({
      receivedLocalStream: true,
    });
  };

  // Invoked when the remote stream is available
  callDidReceiveRemoteStream = ({callId}) => {
    console.log('callDidReceiveRemoteStream');
    this.setState({receivedRemoteStream: true});
  };

  // Invoked when receives info from other clients
  didReceiveCallInfo = ({callId, data}) => {
    console.log('didReceiveCallInfo - ' + JSON.stringify(data));
  };

  // Invoked when the call is handled on another device
  didHandleOnAnotherDevice = ({callId, code, description}) => {
    console.log(
      'didHandleOnAnotherDevice ' + callId + '***' + code + '***' + description,
    );
    this.setState({status: description});
    switch (code) {
      case 2:
        this.endPress(true);
        break;
      case 3:
        this.endPress(true);
        break;
    }
  };

  // Invoked when audio device has change
  didAudioDeviceChange = ({selectedAudioDevice, availableAudioDevices}) => {
    console.log(
      'didHandleOnAnotherDevice selectedAudioDevice' +
        selectedAudioDevice +
        ' availableAudioDevices-' +
        availableAudioDevices,
    );
  };

  startCall = () => {
    this.setState({status: 'started'});

    this.call.current.setSpeakerphoneOn(
      this.state.callId,
      this.state.isSpeaker,
      (status, code, message) => {},
    );
  };

  switchPress = () => {
    this.call.current.switchCamera(
      this.state.callId,
      (status, code, message) => {
        console.log('switch - ' + message);
      },
    );
  };

  mutePress = () => {
    this.call.current.mute(
      this.state.callId,
      !this.state.isMute,
      (status, code, message) => {
        if (status) {
          this.setState({
            isMute: !this.state.isMute,
          });
        }
      },
    );
  };

  speakerPress = () => {
    this.call.current.setSpeakerphoneOn(
      this.state.callId,
      !this.state.isSpeaker,
      (status, code, message) => {
        console.log('setSpeakerphoneOn: ' + message);
        if (status) {
          this.setState({isSpeaker: !this.state.isSpeaker});
        }
      },
    );
  };

  videoPress = () => {
    this.call.current.enableVideo(
      this.state.callId,
      !this.state.isVideoEnable,
      (status, code, message) => {
        if (status) {
          this.setState({
            isVideoEnable: !this.state.isVideoEnable,
          });
        }
      },
    );
  };

  answerCall = () => {
    this.call.current.answer(this.state.callId, (status, code, message) => {
      console.log('answer: ' + message);
      if (status) {
        this.setState({
          showAnswerBtn: false,
        });
      } else {
        this.endPress(false);
      }
    });
  };

  endPress = (isHangup: boolean) => {
    if (isHangup) {
      this.call.current.hangup(this.state.callId, (status, code, message) => {
        console.log('hangup: ' + message);
        this.props.navigation.popToTop();
      });
    } else {
      this.call.current.reject(this.state.callId, (status, code, message) => {
        console.log('reject: ' + message);
        this.props.navigation.popToTop();
      });
    }
  };

  render(): React.ReactNode {
    const CircleBtn = ({color, iconName, iconColor, onPress}) => (
      <TouchableOpacity
        style={{
          width: 70,
          height: 70,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 100,
          backgroundColor: color,
        }}
        onPress={onPress}>
        <Icon name={iconName} type="material" color={iconColor} size={30} />
      </TouchableOpacity>
    );

    return (
      <View style={this.styles.container}>
        {this.state.isVideoCall &&
          this.state.callId !== '' &&
          this.state.receivedRemoteStream && (
            <StringeeVideoView
              style={this.styles.remoteView}
              callId={this.state.callId}
              local={false}
              overlay={false}
            />
          )}

        {this.state.receivedLocalStream &&
          this.state.callId !== '' &&
          this.state.isVideoCall && (
            <StringeeVideoView
              style={this.styles.localView}
              callId={this.state.callId}
              local={true}
              overlay={true}
            />
          )}

        {this.state.isVideoCall && (
          <View style={this.styles.btnSwitch}>
            <CircleBtn
              color="transparent"
              iconName="switch-camera"
              iconColor="white"
              onPress={this.switchPress}
            />
          </View>
        )}

        <Text style={this.styles.userId}>
          {this.state.isIncoming
            ? this.props.route.params.from
            : this.props.route.params.to}
        </Text>

        <Text style={this.styles.status}>{this.state.status}</Text>

        {!this.state.showAnswerBtn && (
          <View style={this.styles.bottomContainer}>
            <CircleBtn
              color={this.state.isMute ? '#FFFFFF8A' : 'white'}
              iconName={this.state.isMute ? 'mic-off' : 'mic'}
              iconColor={this.state.isMute ? 'white' : 'black'}
              onPress={this.mutePress}
            />

            <CircleBtn
              color={this.state.isSpeaker ? '#FFFFFF8A' : 'white'}
              iconName={this.state.isSpeaker ? 'volume-up' : 'volume-off'}
              iconColor={this.state.isSpeaker ? 'white' : 'black'}
              onPress={this.speakerPress}
            />

            {this.state.isVideoCall && (
              <CircleBtn
                color={!this.state.isVideoEnable ? '#FFFFFF8A' : 'white'}
                iconName={
                  !this.state.isVideoEnable ? 'videocam-off' : 'videocam'
                }
                iconColor={!this.state.isVideoEnable ? 'white' : 'black'}
                onPress={this.videoPress}
              />
            )}
          </View>
        )}

        <View style={this.styles.callActions}>
          {this.state.showAnswerBtn && (
            <CircleBtn
              color={'green'}
              iconName={'call'}
              iconColor={'white'}
              onPress={this.answerCall}
            />
          )}

          <CircleBtn
            color={'red'}
            iconName={'call-end'}
            iconColor={'white'}
            onPress={() => {
              this.endPress(!this.state.showAnswerBtn);
            }}
          />
        </View>

        <StringeeCall
          clientId={this.state.clientId}
          ref={this.call}
          eventHandlers={this.callEvents}
        />
      </View>
    );
  }

  styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: '#00A6AD',
      position: 'relative',
    },

    btnSwitch: {
      top: 10,
      left: 10,
      position: 'absolute',
      zIndex: 1,
    },

    bottomContainer: {
      height: 70,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      position: 'absolute',
      bottom: 110,
      zIndex: 1,
    },

    callActions: {
      height: 70,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      position: 'absolute',
      bottom: 20,
      zIndex: 1,
    },

    userId: {
      color: 'white',
      justifyContent: 'center',
      fontSize: 28,
      fontWeight: 'bold',
      marginTop: 130,
    },

    status: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
      marginTop: 20,
    },

    localView: {
      backgroundColor: 'black',
      position: 'absolute',
      top: 20,
      right: 20,
      width: 100,
      height: 150,
      zIndex: 1,
    },
    remoteView: {
      backgroundColor: 'black',
      position: 'absolute',
      top: 0,
      left: 0,
      width: width,
      height: height,
      zIndex: 0,
    },
  });
}
