import React, {Component} from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  TextInput,
  PermissionsAndroid,
} from 'react-native';
import {AsyncStorage, AppState} from 'react-native';
import {StringeeClient, StringeeCall} from 'stringee-react-native';
import CallScreen from './src/CallScreen';
import messaging from '@react-native-firebase/messaging';
import {each} from 'underscore';

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

class AppAndroid extends Component {
  state = {
    appState: AppState.currentState,

    toUserId: '',
    currentUserId: '',
    userId: '',
    callId: '',

    answeredCall: false, // da answer call cua stringee
    isActivateAudioSession: false,

    // Push notification
    pushToken: '',
    registeredToken: false, // da register push token vs Stringee

    callState: '', // Su dung de hien thi text cho trang thai call

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

    console.log('callButtonClicked');
    this.refs.stringeeCall.makeCall(
      parameters,
      (status, code, message, callId) => {
        console.log(
          'status-' +
            status +
            ' code-' +
            code +
            ' message-' +
            message +
            'callId-' +
            callId,
        );
        if (status) {
          this.setState({
            showCallingView: true,
            callId: callId,
            userId: this.state.toUserId,
            answeredCall: true,
            callState: 'Outgoing Call',
          });
        } else {
          Alert.alert('Make call fail: ' + message);
        }
      },
    );
  };

  endCallAndUpdateView = () => {
    // reset trang thai va view
    this.setState({
      callState: 'Ended',
    });

    setTimeout(() => {
      this.setState({
        showCallingView: false,
        hasReceivedLocalStream: false,
        hasReceivedRemoteStream: false,
        isActivateAudioSession: false,
        answeredCall: false,
        enableVideo: true,
        isSpeaker: true,
        isMute: false,
      });
    }, 500);
  };

  answerCallAction = () => {
    this.refs.stringeeCall.answer(
      this.state.callId,
      (status, code, message) => {
        this.setState({answeredCall: true});
        console.log('call did answer ' + status + ' - message: ' + message);
        if (status) {
          // Sucess
        } else {
          // Fail
        }
      },
    );
  };

  onChangeText = text => {
    this.setState({toUserId: text});
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
  }

  /// MARK: - CONNECT EVENT HANDLER
  // The client connects to Stringee server
  _clientDidConnect = ({userId}) => {
    console.log('_clientDidConnect - ' + userId);
    this.setState({currentUserId: userId});
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
  _callIncomingCall = ({
    callId,
    from,
    to,
    fromAlias,
    toAlias,
    callType,
    isVideoCall,
    customDataFromYourServer,
    serial,
  }) => {
    console.log(
      'IncomingCallId-' +
        callId +
        ' from-' +
        from +
        ' to-' +
        to +
        ' fromAlias-' +
        fromAlias +
        ' toAlias-' +
        toAlias +
        ' isVideoCall-' +
        isVideoCall +
        'callType-' +
        callType +
        'serial-' +
        serial,
    );

    this.setState({
      userId: from,
      callState: 'Incoming Call',
      showCallingView: true,
      callId: callId,
    });

    this.refs.stringeeCall.initAnswer(callId, (status, code, message) => {
      console.log('initAnswer ' + message);
    });
  };

  /// MARK: - CALL EVENT HANDLER
  // Invoked when the call signaling state changes
  _callDidChangeSignalingState = ({
    callId,
    code,
    reason,
    sipCode,
    sipReason,
  }) => {
    console.log(
      '_callDidChangeSignalingState ' +
        ' callId-' +
        callId +
        'code-' +
        code +
        ' reason-' +
        reason +
        ' sipCode-' +
        sipCode +
        ' sipReason-' +
        sipReason,
    );

    this.setState({
      callState: reason,
    });

    switch (code) {
      case 3:
        // Rejected
        this.endCallAndUpdateView();
        break;
      case 4:
        // Ended
        this.endCallAndUpdateView();
        break;
    }
  };

  // Invoked when the call media state changes
  _callDidChangeMediaState = ({callId, code, description}) => {
    console.log(
      '_callDidChangeMediaState' +
        ' callId-' +
        callId +
        'code-' +
        code +
        ' description-' +
        description,
    );
    switch (code) {
      case 0:
        this.setState({callState: 'Started'});
        break;
      case 1:
        break;
    }

    this.refs.stringeeCall.setSpeakerphoneOn(
      callId,
      true,
      (status, code, message) => {
        console.log(message);
      },
    );
  };

  // Invoked when the local stream is available
  _callDidReceiveLocalStream = ({callId}) => {
    this.setState({hasReceivedLocalStream: true});
  };
  // Invoked when the remote stream is available
  _callDidReceiveRemoteStream = ({callId}) => {
    this.setState({hasReceivedRemoteStream: true});
  };

  // Invoked when receives a DMTF
  _didReceiveDtmfDigit = ({callId, dtmf}) => {};

  // Invoked when receives info from other clients
  _didReceiveCallInfo = ({callId, data}) => {};

  // Invoked when the call is handled on another device
  _didHandleOnAnotherDevice = ({callId, code, description}) => {
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
      this.state.callId,
      !this.state.isMute,
      (status, code, message) => {
        this.setState({isMute: !this.state.isMute});
      },
    );
  };

  _speakerAction = () => {
    this.refs.stringeeCall.setSpeakerphoneOn(
      this.state.callId,
      !this.state.isSpeaker,
      (status, code, message) => {
        this.setState({isSpeaker: !this.state.isSpeaker});
      },
    );
  };

  _enableVideoAction = () => {
    this.refs.stringeeCall.enableVideo(
      this.state.callId,
      !this.state.enableVideo,
      (status, code, message) => {
        this.setState({enableVideo: !this.state.enableVideo});
      },
    );
  };

  _switchCameraAction = () => {
    this.refs.stringeeCall.switchCamera(
      this.state.callId,
      (status, code, message) => {
        console.log(message);
      },
    );
  };

  async componentDidMount() {
    const user1 =
      'eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTS0UxUmRVdFVhWXhOYVFRNFdyMTVxRjF6VUp1UWRBYVZULTE2MTM5NjY4NjEiLCJpc3MiOiJTS0UxUmRVdFVhWXhOYVFRNFdyMTVxRjF6VUp1UWRBYVZUIiwiZXhwIjoxNjE2NTU4ODYxLCJ1c2VySWQiOiJ1c2VyMSJ9.tdbwblhqP_wPoLzjZcZO9xl9L4VSEkZ1FweM42ZyjCM';
    const user2 =
      'eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTS0xIb2NCdDl6Qk5qc1pLeThZaUVkSzRsU3NBZjhCSHpyLTE1OTQ3MTY0NTYiLCJpc3MiOiJTS0xIb2NCdDl6Qk5qc1pLeThZaUVkSzRsU3NBZjhCSHpyIiwiZXhwIjoxNTk3MzA4NDU2LCJ1c2VySWQiOiJ1c2VyMiJ9.mWoqyI9M0O8sZKiYPSJarWHVBCD2lUQLpBJZXKOiyuM';
    // const stringeeDevUser = "eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTS3JTaWZRWlVJa3ZPY2Q0RHdZT2c1Y2lpQUJma01kTTJOLTE1OTU5MDQxNDQiLCJpc3MiOiJTS3JTaWZRWlVJa3ZPY2Q0RHdZT2c1Y2lpQUJma01kTTJOIiwiZXhwIjoxNTk1OTkwNTQ0LCJ1c2VySWQiOiJhY19ranpvY2d0b29kb2N5MGM0IiwiaWNjX2FwaSI6dHJ1ZSwiZGlzcGxheU5hbWUiOiJIb2FuZ0R1b2MiLCJhdmF0YXJVcmwiOiJodHRwczpcL1wvYXBpLnN0cmluZ2VleC5jb21cL2FjX2tqem9jZ3Rvb2RvY3kwYzRcL0RWVlhNR0lRSkEtMTU3ODQ1NDYzNjIwNS5qcGciLCJzdWJzY3JpYmUiOiJvbmxpbmVfc3RhdHVzX0dSWE1LNzBLLEFMTF9DQUxMX1NUQVRVUyxhZ2VudF9tYW51YWxfc3RhdHVzIiwiYXR0cmlidXRlcyI6Ilt7XCJhdHRyaWJ1dGVcIjpcIm9ubGluZVN0YXR1c1wiLFwidG9waWNcIjpcIm9ubGluZV9zdGF0dXNfR1JYTUs3MEtcIn0se1wiYXR0cmlidXRlXCI6XCJjYWxsXCIsXCJ0b3BpY1wiOlwiY2FsbF9HUlhNSzcwS1wifV0ifQ.iJUqqFcfpORSTSEuoGe59FgGvg0y7mlJb2BJmyvo5aY";

    await this.refs.stringeeClient.connect(user1);
    requestPermission();

    AppState.addEventListener('change', this._handleAppStateChange);
  }

  async componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  _handleAppStateChange = nextAppState => {
    this.setState({appState: nextAppState});
    console.log('App state ' + this.state.appState);
  };

  render() {
    const {showCallingView} = this.state;
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
            <View style={{flex: 1}}>
              <CallScreen
                hasLocalStream={this.state.hasReceivedLocalStream}
                hasRemoteStream={this.state.hasReceivedRemoteStream}
                stringeeCallId={this.state.callId}
                userId={this.state.userId}
                isAnswered={this.state.answeredCall}
                callState={this.state.callState}
                endButtonHandler={() => {
                  this.refs.stringeeCall.hangup(
                    this.state.callId,
                    (status, code, message) => {
                      this.endCallAndUpdateView();
                    },
                  );
                }}
                rejectButtonHandler={() => {
                  this.refs.stringeeCall.reject(
                    this.state.callId,
                    (status, code, message) => {
                      this.endCallAndUpdateView();
                    },
                  );
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

        <Text style={{height: 40, marginBottom: 10, textAlign: 'center'}}>
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

export default AppAndroid;
