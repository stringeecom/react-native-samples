import React, { Component } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableHighlight, View, TextInput, PermissionsAndroid } from 'react-native';
import { AsyncStorage, Platform, AppState, } from 'react-native';
import { StringeeClient, StringeeCall } from 'stringee-react-native';
import RNCallKeep from 'react-native-callkeep';
import VoipPushNotification from 'react-native-voip-push-notification';
import uuid from 'react-native-uuid';
import CallScreen from './src/CallScreen';
import messaging from '@react-native-firebase/messaging';
import { each } from 'underscore';

const options = {
  ios: {
    appName: 'Stringee',
    includesCallsInRecents: false,
  },
};

const speakerPromise = RNCallKeep.checkSpeaker;

const requestPermission = async () =>
  new Promise((resolve, reject) => {
    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
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
  });

class App extends Component {
  state = {
    appState: AppState.currentState,

    toUserId: '',
    currentUserId: '',
    currentStringeeCallId: '',
    currentCallKitId: '',
    userId: '',

    isAnswered: false,
    isActivateAudioSession: false,
    callWaitingAudioSection: false,
    cacheAction: 0, // 0: Không có, 1: Đã bấm answer, 2: Đã bấm end

    callState: '',

    showCallingView: false,
    hasReceivedLocalStream: false,
    hasReceivedRemoteStream: false,

    enableVideo: true,
    isSpeaker: true,
    isMute: false,
  };

  callButtonClick = () => {
    const myObj = {
      from: this.state.currentUserId, // caller
      to: this.state.toUserId, // callee
      isVideoCall: true, // Cuộc gọi là video call hoặc voice call
      videoResolution: 'NORMAL', // chất lượng hình ảnh 'NORMAL' hoặc 'HD'. Mặc định là 'NORMAL'.
    };

    const parameters = JSON.stringify(myObj);

    console.log("callButtonClicked");
    this.refs.stringeeCall.makeCall(parameters, (status, code, message, callId) => {
      console.log('status-' + status + ' code-' + code + ' message-' + message + 'callId-' + callId);
      if (status) {
        this.setState({
          currentStringeeCallId: callId,
          showCallingView: true,
          userId: this.state.toUserId,
          isAnswered: true,
          callState: 'Outgoing Call',
        });
      } else {
        Alert.alert('Make call fail: ' + message);
      }
    },
    );
  };

  endcallAction = () => {
    if (this.state.currentCallKitId != '') {
      RNCallKeep.endCall(this.state.currentCallKitId);
      this.setState({ currentCallKitId: '' });
    }
    this.setState({
      callState: 'Ended',
      currentStringeeCallId: '',
      isActivateAudioSession: false,
    });
    setTimeout(() => {
      this.setState({
        showCallingView: false,
        hasReceivedLocalStream: false,
        hasReceivedRemoteStream: false,
        enableVideo: true,
        isSpeaker: true,
        isMute: false
      });
    }, 500);
  };

  answerCallAction = () => {
    if (this.state.isActivateAudioSession) {
      this.refs.stringeeCall.answer(
        this.state.currentStringeeCallId,
        (status, code, message) => {
          this.setState({ isAnswered: true });
          console.log('call did answer ' + status + ' - message: ' + message);
          if (status) {
            // Sucess
          } else {
            // Fail
          }
        },
      );
    } else {
      this.setState({ callWaitingAudioSection: true })
    }
  };

  onChangeText = text => {
    this.setState({ toUserId: text });
    console.log(text);
  };

  constructor(props) {
    super(props);
    console.disableYellowBox = true;

    this.clientEventHandlers = {
      onConnect: this._clientDidConnect,
      onDisConnect: this._clientDidDisConnect,
      onFailWithError: this._clientDidFailWithError,
      onRequestAccessToken: this._clientRequestAccessToken,
      onIncomingCall: this._callIncomingCall,
    };

    this.callEventHandlers = {
      onChangeSignalingState: this._callDidChangeSignalingState,
      onChangeMediaState: this._callDidChangeMediaState,
      onReceiveLocalStream: this._callDidReceiveLocalStream,
      onReceiveRemoteStream: this._callDidReceiveRemoteStream,
      onReceiveDtmfDigit: this._didReceiveDtmfDigit,
      onReceiveCallInfo: this._didReceiveCallInfo,
      onHandleOnAnotherDevice: this._didHandleOnAnotherDevice,
    };

    if (Platform.OS === 'ios') {
      RNCallKeep.setup(options);
      VoipPushNotification.requestPermissions();

      VoipPushNotification.addEventListener('register', token => {
        // --- send token to your apn provider server
        console.log('register VOIP: ' + token);

        // send token to your apn provider server
        this.refs.stringeeClient.registerPush(
          token,
          false, // isProduction: false: In development, true: In Production.
          true, // (iOS) isVoip: true: Voip PushNotification. Stringee supports this push notification.
          (status, code, message) => {
            console.log('Stringee register VOIP: ' + message);
          },
        );
      });

      VoipPushNotification.addEventListener('notification', notification => {
        const callKitUUID = notification.getData().uuid;
        if (this.state.currentCallKitId == '') {
          console.log('set uuid: ' + callKitUUID);
          this.setState({ currentCallKitId: callKitUUID });
        } else {
          // if Callkit already exists then end Callkit wiht the callKitUUID
          console.log('end call uuid: ' + callKitUUID);
          RNCallKeep.endCall(callKitUUID);
        }
      });

      RNCallKeep.addEventListener('didActivateAudioSession', (data) => {
        this.setState({ isActivateAudioSession: true })
        if (this.state.callWaitingAudioSection) {
          this.answerCallAction();
          this.setState({ callWaitingAudioSection: false });
        }
      });

      RNCallKeep.addEventListener(
        'didReceiveStartCallAction',
        ({ handle, callUUID, name }) => { },
      );

      RNCallKeep.addEventListener('didPerformSetMutedCallAction', ({ muted, callUUID }) => {
        if (muted != this.state.isMute) {
          this._muteAction()
        }
      });

      RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
        if (callUUID != this.state.currentCallKitId) {
          return;
        }

        if (this.state.currentStringeeCallId == '') {
          this.setState({ cacheAction: 1 });
        } else {
          this.answerCallAction();
        }
      });

      RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
        if (callUUID != this.state.currentCallKitId) {
          return;
        }

        if (this.state.currentStringeeCallId == '') {
          this.setState({ cacheAction: 2 });
        } else {
          if (this.state.isAnswered) {
            this.refs.stringeeCall.hangup(
              this.state.currentStringeeCallId,
              (status, code, message) => {
                console.log('stringeeCall.hangup: ' + message);
                if (status) {
                  // Sucess
                } else {
                  // Fail
                }
              },
            );
          } else {
            this.refs.stringeeCall.reject(
              this.state.currentStringeeCallId,
              (status, code, message) => {
                console.log('stringeeCall.reject: ' + message);
                if (status) {
                  // Sucess
                } else {
                  // Fail
                }
              },
            );
          }
        }

        this.setState({ currentCallKitId: '' });
      });
    }
  }

  /// MARK: - CONNECT EVENT HANDLER
  // The client connects to Stringee server
  _clientDidConnect = ({ userId }) => {
    console.log('_clientDidConnect - ' + userId);
    this.setState({ currentUserId: userId });

    if (Platform.OS === 'ios') {
      VoipPushNotification.registerVoipToken();
    } else {
      AsyncStorage.getItem('isPushTokenRegistered').then(value => {
        if (value !== 'true') {
          messaging()
            .getToken()
            .then(token => {
              console.log('token' + token);
              this.refs.stringeeClient.registerPush(
                token,
                true,
                true,
                (result, code, desc) => {
                  console.log(
                    'result: ' + result + 'code: ' + code + 'desc: ' + desc,
                  );
                  if (result) {
                    AsyncStorage.multiSet([
                      ['isPushTokenRegistered', 'true'],
                      ['token', token],
                    ]);
                  }
                },
              );
            });
        }
      });

      messaging().onTokenRefresh(token => {
        this.refs.stringeeClient.registerPush(
          token,
          true,
          true,
          (result, code, desc) => {
            console.log('StringeeConnect', result);
            if (result) {
              AsyncStorage.multiSet([
                ['isPushTokenRegistered', 'true'],
                ['token', token],
              ]);
            }
          },
        );
      });
    }
  };

  // The client disconnects from Stringee server
  _clientDidDisConnect = () => {
    console.log('_clientDidDisConnect');
  };

  // The client fails to connects to Stringee server
  _clientDidFailWithError = () => {
    console.log('_clientDidFailWithError');
  };

  // Access token is expired. A new access token is required to connect to Stringee server
  _clientRequestAccessToken = () => {
    console.log('_clientRequestAccessToken');
    // this.refs.client.connect('NEW_YOUR_ACCESS_TOKEN');
  };

  // IncomingCall event
  _callIncomingCall = ({ callId, from, to,
    fromAlias,
    toAlias,
    callType,
    isVideoCall,
  }) => {
    console.log('IncomingCallId-' + callId + ' from-' + from + ' to-' + to + ' fromAlias-' +
      fromAlias + ' toAlias-' + toAlias + ' isVideoCall-' + isVideoCall + 'callType-' + callType);

    this.refs.stringeeCall.initAnswer(callId, (status, code, message) => {
      console.log(message);
    });

    this.setState({
      currentStringeeCallId: callId,
      showCallingView: true,
      isAnswered: false,
      userId: from,
      callState: 'Incoming Call',
    });

    if (Platform.OS === 'ios') {
      switch (this.state.cacheAction) {
        case 0: // Trường hợp bình thường
          this.setState({ showCallingView: true });
          if (this.state.currentCallKitId != '') {
            RNCallKeep.updateDisplay(
              this.state.currentCallKitId,
              fromAlias,
              '',
            );
            console.log('Call + Update');
          } else {
            var callKitUUID = uuid.v1();
            this.setState({ currentCallKitId: callKitUUID });
            RNCallKeep.displayIncomingCall(
              callKitUUID,
              'Stringee',
              fromAlias,
              'generic',
              true,
            );
            console.log('Call + Show new call kit');
          }
          break;

        case 1: // Trường hợp đã bấm answer
          this.setState({ showCallingView: true });
          this.answerCallAction();
          break;

        case 2: // Trường hợp đã bấm Reject
          this.refs.stringeeCall.reject(
            this.state.currentStringeeCallId,
            (status, code, message) => {
              console.log(message);
            },
          );
          break;

        default:
          break;
      }

      this.setState({ cacheAction: 0 });
    }
  };

  /// MARK: - CALL EVENT HANDLER
  // Invoked when the call signaling state changes
  _callDidChangeSignalingState = ({ callId, code, reason, sipCode, sipReason }) => {
    console.log('_callDidChangeSignalingState ' + ' callId-' + callId + 'code-' +
      code + ' reason-' + reason + ' sipCode-' + sipCode + ' sipReason-' + sipReason);
    switch (code) {
      case 0:
        this.setState({ callState: reason });
        break;
      case 1:
        this.setState({ callState: reason });
        break;
      case 2:
        this.setState({ callState: reason });
        break;
      case 3:
        this.setState({ callState: reason });
        this.endcallAction();
        break;
      case 4:
        this.setState({ callState: reason });
        this.endcallAction();
        break;
    }
  };

  // Invoked when the call media state changes
  _callDidChangeMediaState = ({ callId, code, description }) => {
    console.log('_callDidChangeMediaState' + ' callId-' + callId + 'code-' + code + ' description-' + description);
    switch (code) {
      case 0:
        this.setState({ callState: 'Started' });
        break;
      case 1:
        break;
    }

    this.refs.stringeeCall.setSpeakerphoneOn(
      this.state.currentStringeeCallId,
      true,
      (status, code, message) => {
        console.log(message);
      },
    );
  };

  // Invoked when the local stream is available
  _callDidReceiveLocalStream = ({ callId }) => {
    this.setState({ hasReceivedLocalStream: true });
  };
  // Invoked when the remote stream is available
  _callDidReceiveRemoteStream = ({ callId }) => {
    this.setState({ hasReceivedRemoteStream: true });
  };

  // Invoked when receives a DMTF
  _didReceiveDtmfDigit = ({ callId, dtmf }) => { };

  // Invoked when receives info from other clients
  _didReceiveCallInfo = ({ callId, data }) => { };

  // Invoked when the call is handled on another device
  _didHandleOnAnotherDevice = ({ callId, code, description }) => {
    console.log(
      '_didHandleOnAnotherDevice ' +
      callId +
      '***' +
      code +
      '***' +
      description,
    );
  };

  // Action handler

  _muteAction = () => {
    this.refs.stringeeCall.mute(
      this.state.currentStringeeCallId,
      !this.state.isMute,
      (status, code, message) => {
        this.setState({ isMute: !this.state.isMute });
        if (this.state.currentCallKitId != '') {
          RNCallKeep.setMutedCall(this.state.currentCallKitId, this.state.isMute);
        }
      },
    );
  };

  _speakerAction = () => {
    this.refs.stringeeCall.setSpeakerphoneOn(
      this.state.currentStringeeCallId,
      !this.state.isSpeaker,
      (status, code, message) => {
        this.setState({ isSpeaker: !this.state.isSpeaker });
      },
    );
  }

  _enableVideoAction = () => {
    this.refs.stringeeCall.enableVideo(
      this.state.currentStringeeCallId,
      !this.state.enableVideo,
      (status, code, message) => {
        this.setState({ enableVideo: !this.state.enableVideo });
      },
    );
  }

  _switchCameraAction = () => {
    this.refs.stringeeCall.switchCamera(
      this.state.currentStringeeCallId,
      (status, code, message) => {
        console.log(message);
      },
    );
  }


  async componentDidMount() {
    //user5
    // const token = "eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTSzRPNEVRa2J0VDdkTFBFSzBBbGJOTEdTaGpUcjBnaVFOLTE1OTM0OTk2MTkiLCJpc3MiOiJTSzRPNEVRa2J0VDdkTFBFSzBBbGJOTEdTaGpUcjBnaVFOIiwiZXhwIjoxNTk2MDkxNjE5LCJ1c2VySWQiOiJ1c2VyNSJ9.ykTc1_nBgl00fmMgKax0beMhIp6kYx3czRqXZKs7HnQ"

    //user6
    // const token = 'eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTSzRPNEVRa2J0VDdkTFBFSzBBbGJOTEdTaGpUcjBnaVFOLTE1OTM0OTk2MzEiLCJpc3MiOiJTSzRPNEVRa2J0VDdkTFBFSzBBbGJOTEdTaGpUcjBnaVFOIiwiZXhwIjoxNTk2MDkxNjMxLCJ1c2VySWQiOiJ1c2VyNiJ9.LwGAqw_oEbDpjL0Bmg0rOdBF_I2QWQnrF-p_9ZDbJmU';

    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImN0eSI6InN0cmluZ2VlLWFwaTt2PTEifQ.eyJqdGkiOiJTS2w5MEdjSkJPWHdleW1oMHc4cmJuRlkwbml0eXZuS05oLTE1OTQyNjMyNzkiLCJpc3MiOiJTS2w5MEdjSkJPWHdleW1oMHc4cmJuRlkwbml0eXZuS05oIiwiZXhwIjoxNTk2ODU1Mjc5LCJpY2NfYXBpIjp0cnVlLCJpYXQiOjE1OTQyNjIzNzksInVzZXJJZCI6Im5pdGNvLmFwcCJ9.6UPtXtTzUseBeAKTFhCt3Bdpep0RDpWeKtjW0OLyNbU"

    await this.refs.stringeeClient.connect(token);
    if (Platform.OS === 'android') {
      requestPermission();
    }

    AppState.addEventListener('change', this._handleAppStateChange);
  }

  async componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  _handleAppStateChange = (nextAppState) => {
    var thisInstance = this;
    if ((Platform.OS === 'ios') && (this.state.appState.match(/inactive|background/) && nextAppState === 'active')) {
      console.log('App has come to the foreground!');
      RNCallKeep.checkSpeaker().then(function (speaker) {
        console.log('RNCallKeep.checkSpeaker ' + speaker);
        thisInstance.setState({ isSpeaker: speaker });
      }, function (error) {
        console.log(error.message);
      });
    }

    this.setState({ appState: nextAppState });
    console.log('App state ' + this.state.appState);
  }


  render() {
    const { showCallingView } = this.state;
    return (
      <View style={styles.topCenteredView}>
        <Modal
          animationType="slide"
          transparent={false}
          visible={showCallingView}
          onRequestClose={() => {
            Alert.alert('Modal has been closed.');
          }}>
          {this.state.showCallingView && (
            <View style={{ flex: 1 }}>
              <CallScreen
                hasLocalStream={this.state.hasReceivedLocalStream}
                hasRemoteStream={this.state.hasReceivedRemoteStream}
                stringeeCallId={this.state.currentStringeeCallId}
                userId={this.state.userId}
                isAnswered={this.state.isAnswered}
                callState={this.state.callState}
                endButtonHandler={() => {
                  this.endcallAction();
                  this.refs.stringeeCall.hangup(
                    this.state.currentStringeeCallId, (status, code, message) => { });
                }}
                rejectButtonHandler={() => {
                  this.endcallAction();
                  this.refs.stringeeCall.reject(this.state.currentStringeeCallId, (status, code, message) => { });
                }}
                acceptButtonHandler={() => {
                  this.answerCallAction();
                }}

                switchCameraHandler={this._switchCameraAction}

                isSpeaker={this.state.isSpeaker}
                peakerButtonHandler={this._speakerAction}

                isMute={this.state.isMute}
                muteButtonHandler={this._muteAction}

                enableVideo={this.state.enableVideo}
                enableVideoButtonHandler={this._enableVideoAction}
              />
            </View>
          )}
        </Modal>

        <Text style={{ height: 40, marginBottom: 10, textAlign: 'center' }}>
          {this.state.currentUserId}
        </Text>

        <TextInput
          style={{
            height: 40,
            width: 200,
            color: 'black',
            borderColor: 'gray',
            borderWidth: 1,
            marginBottom: 30,
            textAlign: 'center',
          }}
          onChangeText={text => this.onChangeText(text)}
          value={this.state.toUserId}
        />

        <TouchableHighlight
          style={styles.callButton}
          onPress={() => {
            this.callButtonClick();
          }}>
          <Text style={styles.textStyle}>Call</Text>
        </TouchableHighlight>

        <View>
          <StringeeClient
            ref="stringeeClient"
            eventHandlers={this.clientEventHandlers}
          />
          <StringeeCall
            ref="stringeeCall"
            eventHandlers={this.callEventHandlers}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },

  topCenteredView: {
    flex: 1,
    alignItems: 'center',
    marginTop: 150,
  },

  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  callButton: {
    backgroundColor: 'green',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    width: 80,
  },
});

export default App;