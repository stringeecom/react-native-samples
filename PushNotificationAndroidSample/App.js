/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

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
import {AppState} from 'react-native';
import {
  StringeeClient,
  StringeeCall,
  StringeeCall2,
} from 'stringee-react-native';
import CallScreen from './src/CallScreen';
import messaging from '@react-native-firebase/messaging';
import {each} from 'underscore';
import notifee, {EventType} from '@notifee/react-native';
import NotificationCommon from './src/NotificationCommon';

const requestPermission = async () =>
  new Promise((resolve, reject) => {
    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
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
  stringeeClient = React.createRef();
  stringeeCall = React.createRef();
  stringeeCall2 = React.createRef();
  static actionPressed: string;
  static callViewIsShow: boolean = false;
  isInCall: boolean = false;

  state = {
    appState: AppState.currentState,

    toUserId: '',
    currentUserId: '',
    userId: '',
    callId: '',
    clientId: null,

    answeredCall: false, // da answer call cua stringee
    isStringeeCall: false,

    // Push notification
    pushToken: '',
    registeredToken: false, // da register push token vs Stringee

    callState: '', // Su dung de hien thi text cho trang thai call

    showCallingView: false,
    hasReceivedLocalStream: false,
    hasReceivedRemoteStream: false,

    enableVideo: false,
    isSpeaker: false,
    isMute: false,
    isVideoCall: false,
  };

  constructor(props) {
    super(props);
    console.disableYellowBox = true;

    notifee.onBackgroundEvent(async event => {
      if (event.type === EventType.ACTION_PRESS) {
        console.log('onBackgroundEvent - ' + event.detail.pressAction.id);
        App.actionPressed = event.detail.pressAction.id;
        if (App.callViewIsShow) {
          switch (event.detail.pressAction.id) {
            case NotificationCommon.answerActionId:
              this._answerCallAction();
              // App.event.onAction(event.detail.pressAction.id);
              break;
            case NotificationCommon.rejectActionId:
              this._endCallAction(false);
              break;
          }
        }
        await notifee.cancelNotification(NotificationCommon.notificationId);
      }
    });

    this.clientEventHandlers = {
      onConnect: this._clientDidConnect,
      onDisConnect: this._clientDidDisConnect,
      onFailWithError: this._clientDidFailWithError,
      onRequestAccessToken: this._clientRequestAccessToken,
      onIncomingCall: this._callIncomingCall,
      onIncomingCall2: this._callIncomingCall2,
      onCustomMessage: this._clientReceiveCustomMessage,
    };

    this.callEventHandlers = {
      onChangeSignalingState: this._callDidChangeSignalingState,
      onChangeMediaState: this._callDidChangeMediaState,
      onReceiveLocalStream: this._callDidReceiveLocalStream,
      onReceiveRemoteStream: this._callDidReceiveRemoteStream,
      onReceiveDtmfDigit: this._didReceiveDtmfDigit,
      onReceiveCallInfo: this._didReceiveCallInfo,
      onHandleOnAnotherDevice: this._didHandleOnAnotherDevice,
      onAudioDeviceChange: this._didAudioDeviceChange, ///only available on android
    };
  }

  async componentDidMount() {
    await this.registerEventOpenApp();
    const token =
      'eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTS0UxUmRVdFVhWXhOYVFRNFdyMTVxRjF6VUp1UWRBYVZULTE2OTAzNDEzNzQiLCJpc3MiOiJTS0UxUmRVdFVhWXhOYVFRNFdyMTVxRjF6VUp1UWRBYVZUIiwiZXhwIjoxNjkyOTMzMzc0LCJ1c2VySWQiOiJ1c2VyMSJ9.zVGg9RqtXtdFSfa86NWW5zm9_EHezRbG2-mhV0Vs9Gg';

    await this.stringeeClient.current.connect(token);
    this.setState({clientId: this.stringeeClient.current.getId()});
    await requestPermission();

    messaging().onTokenRefresh(token => {
      this.stringeeClient.current.registerPush(
        token,
        true,
        true,
        (result, code, desc) => {
          console.log(
            'registerPush: \nresult-' +
              result +
              ' code-' +
              code +
              ' desc-' +
              desc,
          );
        },
      );
    });
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  async registerEventOpenApp() {
    const initialNotification = await notifee.getInitialNotification();

    if (initialNotification && initialNotification.pressAction) {
      App.actionPressed = initialNotification.pressAction.id;
    }
    await notifee.cancelNotification(NotificationCommon.notificationId);
  }

  async componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  _handleAppStateChange = async nextAppState => {
    this.setState({appState: nextAppState});
    console.log('App state ' + this.state.appState);
  };

  /// MARK: - CONNECT EVENT HANDLER
  // The client connects to Stringee server
  _clientDidConnect = ({userId}) => {
    console.log('_clientDidConnect - ' + userId);
    this.setState({currentUserId: userId});
    messaging()
      .getToken()
      .then(token => {
        this.stringeeClient.current.registerPush(
          token,
          true,
          true,
          (result, code, desc) => {
            console.log(
              'registerPush: \nresult-' +
                result +
                ' code-' +
                code +
                ' desc-' +
                desc,
            );
          },
        );
      });
  };

  // The client disconnects from Stringee server
  _clientDidDisConnect = () => {
    console.log('_clientDidDisConnect');
  };

  // The client fails to connects to Stringee server
  _clientDidFailWithError = ({code, message}) => {
    console.log(
      '_clientDidFailWithError \ncode-' + code + ' message-' + message,
    );
  };

  // Access token is expired. A new access token is required to connect to Stringee server
  _clientRequestAccessToken = () => {
    console.log('_clientRequestAccessToken');
  };

  // Receive custom message
  _clientReceiveCustomMessage = ({data}) => {
    console.log('_clientReceiveCustomMessage: \n' + data);
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
        ' callType-' +
        callType +
        ' serial-' +
        serial,
    );
    if (this.isInCall) {
      const newCall: StringeeCall = new StringeeCall({
        clientId: this.state.clientId,
      });
      newCall.reject(callId, (status, code, message) => {
        console.log('reject new call when in call');
      });
    } else {
      this.isInCall = true;
      this.setState({
        userId: from,
        callState: 'Incoming Call',
        showCallingView: true,
        callId: callId,
        isStringeeCall: true,
        isVideoCall: isVideoCall,
        enableVideo: isVideoCall,
        isSpeaker: isVideoCall,
      });

      this.stringeeCall.current.initAnswer(callId, (status, code, message) => {
        console.log('initAnswer ' + message);
      });

      if (App.actionPressed && !App.callViewIsShow) {
        switch (App.actionPressed === NotificationCommon.answerActionId) {
          case NotificationCommon.answerActionId:
            this._answerCallAction();
            break;
          case NotificationCommon.rejectActionId:
            this._endCallAction(false);
            break;
        }
        App.actionPressed = undefined;
      }
      App.callViewIsShow = true;
    }
  };

  // IncomingCall event
  _callIncomingCall2 = ({
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
        ' callType-' +
        callType +
        ' serial-' +
        serial,
    );

    if (this.isInCall) {
      const newCall: StringeeCall2 = new StringeeCall2({
        clientId: this.state.clientId,
      });
      newCall.reject(callId, (status, code, message) => {
        console.log('reject new call when in call');
      });
    } else {
      this.isInCall = true;
      this.setState({
        userId: from,
        callState: 'Incoming Call',
        showCallingView: true,
        callId: callId,
        isStringeeCall: false,
        isVideoCall: isVideoCall,
        enableVideo: isVideoCall,
        isSpeaker: isVideoCall,
      });

      this.stringeeCall2.current.initAnswer(callId, (status, code, message) => {
        console.log('initAnswer ' + message);
      });

      if (App.actionPressed && !App.callViewIsShow) {
        switch (App.actionPressed) {
          case NotificationCommon.answerActionId:
            this._answerCallAction();
            break;
          case NotificationCommon.rejectActionId:
            this._endCallAction(false);
            break;
        }
        App.actionPressed = undefined;
      }
      App.callViewIsShow = true;
    }
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
      callState: reason,
    });

    switch (code) {
      case 3:
        // Rejected
        this._endCallAndUpdateView();
        break;
      case 4:
        // Ended

        this._endCallAndUpdateView();
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
    if (this.state.isStringeeCall) {
      this.stringeeCall.current.setSpeakerphoneOn(
        callId,
        this.state.isSpeaker,
        (status, code, message) => {
          console.log(message);
        },
      );
    } else {
      this.stringeeCall2.current.setSpeakerphoneOn(
        callId,
        this.state.isSpeaker,
        (status, code, message) => {
          console.log(message);
        },
      );
    }
  };

  // Invoked when the local stream is available
  _callDidReceiveLocalStream = ({callId}) => {
    console.log('_callDidReceiveLocalStream');
    this.setState({hasReceivedLocalStream: true});
  };
  // Invoked when the remote stream is available
  _callDidReceiveRemoteStream = ({callId}) => {
    console.log('_callDidReceiveRemoteStream');
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

  // Invoked when audio device has change
  _didAudioDeviceChange = ({selectedAudioDevice, availableAudioDevices}) => {
    console.log(
      '_didHandleOnAnotherDevice selectedAudioDevice-k' +
        selectedAudioDevice +
        ' availableAudioDevices-' +
        availableAudioDevices,
    );
  };

  // Action handler

  onChangeText = text => {
    this.setState({toUserId: text});
  };

  callButtonClick = async (isStringeeCall: boolean, isVideoCall: boolean) => {
    this.isInCall = true;
    this.setState({
      isStringeeCall: isStringeeCall,
      isVideoCall: isVideoCall,
    });
    const myObj = {
      from: this.state.currentUserId, // caller
      to: this.state.toUserId, // callee
      isStringeeCall: this.state.isStringeeCall,
      isVideoCall: isVideoCall, // Cuộc gọi là video call hoặc voice call
      videoResolution: 'NORMAL', // chất lượng hình ảnh 'NORMAL' hoặc 'HD'. Mặc định là 'NORMAL'.
    };

    const parameters = JSON.stringify(myObj);

    setTimeout(() => {
      console.log('isStringeeCall-' + isStringeeCall);
      if (isStringeeCall) {
        this.stringeeCall.current.makeCall(
          parameters,
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
                showCallingView: true,
                callId: callId,
                userId: this.state.toUserId,
                answeredCall: true,
                callState: 'Outgoing Call',
                isVideoCall: isVideoCall,
                enableVideo: isVideoCall,
                isSpeaker: isVideoCall,
              });
            } else {
              Alert.alert('Make call fail: ' + message);
            }
          },
        );
      } else {
        this.stringeeCall2.current.makeCall(
          parameters,
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
                showCallingView: true,
                callId: callId,
                userId: this.state.toUserId,
                answeredCall: true,
                callState: 'Outgoing Call',
                isVideoCall: isVideoCall,
                enableVideo: isVideoCall,
                isSpeaker: isVideoCall,
              });
            } else {
              Alert.alert('Make call fail: ' + message);
            }
          },
        );
      }
    }, 100);
  };

  _endCallAndUpdateView = () => {
    App.callViewIsShow = false;
    this.isInCall = false;
    // reset trang thai va view
    this.setState({
      callState: 'Ended',
    });

    setTimeout(() => {
      this.setState({
        showCallingView: false,
        hasReceivedLocalStream: false,
        hasReceivedRemoteStream: false,
        answeredCall: false,
        enableVideo: false,
        isSpeaker: false,
        isMute: false,
        isVideoCall: false,
      });
    }, 500);
  };

  _endCallAction = (isHangUp: boolean) => {
    if (this.state.isStringeeCall) {
      if (isHangUp) {
        this.stringeeCall.current.hangup(
          this.state.callId,
          (status, code, message) => {
            this._endCallAndUpdateView();
          },
        );
      } else {
        this.stringeeCall.current.reject(
          this.state.callId,
          (status, code, message) => {
            this._endCallAndUpdateView();
          },
        );
      }
    } else {
      if (isHangUp) {
        this.stringeeCall2.current.hangup(
          this.state.callId,
          (status, code, message) => {
            this._endCallAndUpdateView();
          },
        );
      } else {
        this.stringeeCall2.current.reject(
          this.state.callId,
          (status, code, message) => {
            this._endCallAndUpdateView();
          },
        );
      }
    }
  };

  _answerCallAction = () => {
    if (this.state.isStringeeCall) {
      this.stringeeCall.current.answer(
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
    } else {
      this.stringeeCall2.current.answer(
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
    }
  };

  _muteAction = () => {
    if (this.state.isStringeeCall) {
      this.stringeeCall.current.mute(
        this.state.callId,
        !this.state.isMute,
        (status, code, message) => {
          this.setState({isMute: !this.state.isMute});
        },
      );
    } else {
      this.stringeeCall2.current.mute(
        this.state.callId,
        !this.state.isMute,
        (status, code, message) => {
          this.setState({isMute: !this.state.isMute});
        },
      );
    }
  };

  _speakerAction = () => {
    if (this.state.isStringeeCall) {
      this.stringeeCall.current.setSpeakerphoneOn(
        this.state.callId,
        !this.state.isSpeaker,
        (status, code, message) => {
          this.setState({isSpeaker: !this.state.isSpeaker});
        },
      );
    } else {
      this.stringeeCall2.current.setSpeakerphoneOn(
        this.state.callId,
        !this.state.isSpeaker,
        (status, code, message) => {
          this.setState({isSpeaker: !this.state.isSpeaker});
        },
      );
    }
  };

  _enableVideoAction = () => {
    if (this.state.isStringeeCall) {
      this.stringeeCall.current.enableVideo(
        this.state.callId,
        !this.state.enableVideo,
        (status, code, message) => {
          this.setState({enableVideo: !this.state.enableVideo});
        },
      );
    } else {
      this.stringeeCall2.current.enableVideo(
        this.state.callId,
        !this.state.enableVideo,
        (status, code, message) => {
          this.setState({enableVideo: !this.state.enableVideo});
        },
      );
    }
  };

  _switchCameraAction = () => {
    if (this.state.isStringeeCall) {
      this.stringeeCall.current.switchCamera(
        this.state.callId,
        (status, code, message) => {
          console.log(message);
        },
      );
    } else {
      this.stringeeCall2.current.switchCamera(
        this.state.callId,
        (status, code, message) => {
          console.log(message);
        },
      );
    }
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
                isVideoCall={this.state.isVideoCall}
                endButtonHandler={() => {
                  this._endCallAction(true);
                }}
                rejectButtonHandler={() => {
                  this._endCallAction(false);
                }}
                acceptButtonHandler={this._answerCallAction}
                switchCameraHandler={this._switchCameraAction}
                isSpeaker={this.state.isSpeaker}
                speakerButtonHandler={this._speakerAction}
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

        <View style={styles.rowButton}>
          <TouchableHighlight
            style={styles.callButton}
            onPress={() => {
              this.callButtonClick(true, false).then(r => {});
            }}>
            <Text style={styles.textStyle}>Voice call</Text>
          </TouchableHighlight>
          <TouchableHighlight
            style={styles.callButton}
            onPress={() => {
              this.callButtonClick(true, true);
            }}>
            <Text style={styles.textStyle}>Video call</Text>
          </TouchableHighlight>
        </View>
        <View style={styles.rowButton}>
          <TouchableHighlight
            style={styles.callButton}
            onPress={() => {
              this.callButtonClick(false, false);
            }}>
            <Text style={styles.textStyle}>Voice call 2</Text>
          </TouchableHighlight>
          <TouchableHighlight
            style={styles.callButton}
            onPress={() => {
              this.callButtonClick(false, true);
            }}>
            <Text style={styles.textStyle}>Video call 2</Text>
          </TouchableHighlight>
        </View>

        <View>
          <StringeeClient
            ref={this.stringeeClient}
            eventHandlers={this.clientEventHandlers}
          />
          {this.state.clientId !== null && this.state.isStringeeCall && (
            <StringeeCall
              ref={this.stringeeCall}
              clientId={this.state.clientId}
              eventHandlers={this.callEventHandlers}
            />
          )}
          {this.state.clientId !== null && !this.state.isStringeeCall && (
            <StringeeCall2
              ref={this.stringeeCall2}
              clientId={this.state.clientId}
              eventHandlers={this.callEventHandlers}
            />
          )}
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
  rowButton: {
    marginBottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  textStyle: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default App;
