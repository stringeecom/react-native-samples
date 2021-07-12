import React, {Component} from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  TextInput, LogBox,
} from 'react-native';
import {AppState} from 'react-native';
import {StringeeClient, StringeeCall} from 'stringee-react-native';
import RNCallKeep from 'react-native-callkeep';
import VoipPushNotification from 'react-native-voip-push-notification';
import uuid from 'react-native-uuid';
import CallScreen from './src/CallScreen';
import SyncCall from './src/SyncCall';

const options = {
  ios: {
    appName: 'Stringee',
    includesCallsInRecents: false,
  },
};

const user1 = 'ACCESS_TOKEN_FOR_USER1'
const user2 = 'ACCESS_TOKEN_FOR_USER2'

class App extends Component {
  state = {
    appState: AppState.currentState,

    toUserId: '',
    currentUserId: '',
    userId: '',

    syncCall: null,
    allSyncCalls: [], // luu lai tat ca cac sync da tung xu ly
    fakeCallIds: [], // luu uuid cua tat ca fake call da show
    endTimeout: null,

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
    isSpeaker: false,
    isMute: false,
  };

  callButtonClick = (isVideoCall) => {
    if (this.state.toUserId == '') {
      return;
    }

    const myObj = {
      from: this.state.currentUserId, // caller
      to: this.state.toUserId, // callee
      isVideoCall: isVideoCall, // Cuộc gọi là video call hoặc voice call
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
            var newSyncCall = new SyncCall();
            newSyncCall.callId = callId;
            newSyncCall.callCode = 0;
            newSyncCall.answered = true;
            newSyncCall.isVideoCall = isVideoCall;

            this.setState({
              syncCall: newSyncCall,
              showCallingView: true,
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
    // End callkit call
    if (this.state.syncCall != null && this.state.syncCall.callkitId != '') {
      RNCallKeep.endCall(this.state.syncCall.callkitId);
    }

    // End tat ca ongoing call cho chac
    RNCallKeep.endAllCalls();

    // reset trang thai va view
    this.setState({
      callState: 'Ended',
    });

    // Xoa sync call neu can
    this.deleteSyncCallIfNeed();

    // Show CallScreen them 0.5s de hien thi trang thai ended (Cho giong native call cua ios)
    setTimeout(() => {
      this.setState({
        showCallingView: false,
        hasReceivedLocalStream: false,
        hasReceivedRemoteStream: false,
        isActivateAudioSession: false,
        answeredCall: false,
        enableVideo: true,
        isSpeaker: false,
        isMute: false,
      });
    }, 500);
  };

  deleteSyncCallIfNeed = () => {
    if (this.state.syncCall == null) {
      console.log('SyncCall is deleted');
      return;
    }

    if (this.state.syncCall.isEnded()) {
      // cache lai call da xu ly
      this.addSyncCallToCacheArray(this.state.syncCall);

      this.setState({
        syncCall: null,
      });
    } else {
      console.log(
          'deleteSyncCallIfNeed, endedCallkit: ' +
          this.state.syncCall.endedCallkit +
          ' endedStringeeCall: ' +
          this.state.syncCall.endedStringeeCall,
      );
    }
  };

  addSyncCallToCacheArray = sCall => {
    // Xoa call cu neu da save
    var newAllSyncCalls = this.state.allSyncCalls.filter(
        call => !(call.callId == sCall.callId && call.serial == sCall.serial),
    );

    newAllSyncCalls.push(sCall);
    this.setState({
      allSyncCalls: newAllSyncCalls,
    });
  };

  removeSyncCallInCacheArray = (callId, serial) => {
    // Xoa call cu neu da save
    var newAllSyncCalls = this.state.allSyncCalls.filter(
        call => !(call.callId == callId && call.serial == serial),
    );

    this.setState({
      allSyncCalls: newAllSyncCalls,
    });
  };

  // Kiem tra xem call da duoc xu ly lan nao chua
  handledCall = (callId, serial) => {
    // Xoa call cu neu da save
    var newAllSyncCalls = this.state.allSyncCalls.filter(
        call => call.callId == callId && call.serial == serial,
    );
    return newAllSyncCalls != null && newAllSyncCalls.length > 0;
  };

  answerCallAction = () => {
    /*
          Voi iOS, Answer StringeeCall khi thoa man cac yeu to:
          1. Da nhan duoc su kien onIncomingCall (có callId)
          2. User da click answer
          3. Chua goi ham answer cua StringeeCall lan nao
          3. AudioSession da active
        **/
    if (
        this.state.syncCall == null ||
        this.state.syncCall.callId == '' ||
        !this.state.isActivateAudioSession ||
        !this.state.syncCall.answered ||
        this.state.answeredCall
    ) {
      console.log(
          'Chua du dieu kien de answer call, AudioSessionActived: ' +
          this.state.isActivateAudioSession +
          ' - syncCall: ' +
          this.state.syncCall +
          ' - syncCall.callId: ' +
          this.state.syncCall.callId +
          ' - AnsweredAction: ' +
          this.state.syncCall.answered +
          ' - AnsweredCall: ' +
          this.state.answeredCall,
      );

      return;
    }

    this.refs.stringeeCall.answer(
        this.state.syncCall.callId,
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

  registerTokenForStringee = () => {
    if (this.state.pushToken == '') {
      console.log('PUSH TOKEN IS INVALID');
      return;
    }

    if (this.state.registeredToken) {
      console.log('DA GUI PUSH TOKEN TOI STRINGEE SERVER');
      return;
    }

    var thisInstance = this;
    this.refs.stringeeClient.registerPush(
        this.state.pushToken,
        false, // isProduction: false: In development, true: In Production.
        true, // (iOS) isVoip: true: Voip PushNotification. Stringee supports this push notification.
        (status, code, message) => {
          console.log('Stringee register VOIP: ' + message);
          thisInstance.setState({registeredToken: status});
        },
    );
  };

  showFakeCall = () => {
    // rule moi cua apple la nhan duoc Voip push bat buoc phai show callkit => voi cac truong hop khong can thiet thi show roi end luon
    var callKitUUID = uuid.v1();
    RNCallKeep.displayIncomingCall(
        callKitUUID,
        'Stringee',
        'CallEnded',
        'generic',
        true,
    );
    var newFakeCallIds = this.state.fakeCallIds.push(callKitUUID);
    this.setState({fakeCallIds: newFakeCallIds});
    console.log(
        'SHOW FAKE CALL, UUID: ' +
        callKitUUID +
        ' fakeCallIds: ' +
        this.state.fakeCallIds.toString,
    );
  };

  startEndTimeout = () => {
    if (this.state.endTimeout == null || this.state.syncCall != null) {
      var endTimeout = setTimeout(() => {
        if (this.state.syncCall == null) {
          return;
        }

        // Sau 3s tu khi connected ma chua nhan duoc call thi end call
        if (!this.state.syncCall.receivedStringeeCall) {
          // End callkit
          if (this.state.syncCall.callkitId != '') {
            RNCallKeep.endCall(this.state.syncCall.callkitId);
          }
          this.addSyncCallToCacheArray(this.state.syncCall);

          this.setState({
            syncCall: null,
          });
        }
      }, 5000);

      this.setState({
        endTimeout: endTimeout,
      });
    }
  };

  stopEndTimeout = () => {
    if (this.state.endTimeout != null) {
      clearTimeout(this.state.endTimeout);
      this.setState({
        endTimeout: null,
      });
    }
  };

  onChangeText = text => {
    this.setState({toUserId: text});
  };

  constructor(props) {
    super(props);
    LogBox.ignoreAllLogs()

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

    RNCallKeep.setup(options);
    // VoipPushNotification.requestPermissions();
    VoipPushNotification.registerVoipToken();

    VoipPushNotification.addEventListener('register', token => {
      console.log('LAY DUOC VOIP TOKEN: ' + token);
      this.setState({pushToken: token});
      this.registerTokenForStringee();
    });

    VoipPushNotification.addEventListener('notification', notification => {
      const callKitUUID = notification.uuid;
      const callSerial = notification.serial;
      const callId = notification.callId;
      console.log(
          'Notification CallSerial: ' + callSerial + ' callId: ' + callId + 'uuid: ' + callKitUUID
      );
      // Neu call da duoc xu ly roi thi end callkit vua show
      if (this.handledCall(callId, callSerial)) {
        RNCallKeep.endCall(callKitUUID);
        this.removeSyncCallInCacheArray(callId, callSerial);
        this.deleteSyncCallIfNeed();
        return;
      }

      // Chua co sync call thi tao
      if (this.state.syncCall == null) {
        // Chua co call thi khoi tao
        var newSyncCall = new SyncCall();
        newSyncCall.callId = callId;
        newSyncCall.serial = callSerial;
        newSyncCall.callkitId = callKitUUID;
        this.setState({syncCall: newSyncCall});
        return;
      }

      // Co sync call roi nhung thong tin cuoc goi khong trung khop => end callkit vua show
      if (!this.state.syncCall.isThisCall(callId, callSerial)) {
        console.log(
            'END CALLKIT KHI NHAN DUOC PUSH, PUSH MOI KHONG PHAI SYNC CALL',
        );
        RNCallKeep.endCall(callKitUUID);
        return;
      }

      // Co sync call roi + thong tin cuoc goi trung khop nhung da show callkit roi => end callkit vua show
      if (
          this.state.syncCall.showedCallkit() &&
          !this.state.syncCall.showedFor(callKitUUID)
      ) {
        console.log(
            'END CALLKIT KHI NHAN DUOC PUSH, SYNC CALL DA SHOW CALLKIT',
        );
        RNCallKeep.endCall(callKitUUID);
        return;
      }

      // if (this.state.currentCallKitId == '') {
      //   console.log('set uuid: ' + callKitUUID);
      //   this.setState({ currentCallKitId: callKitUUID });
      // } else {
      //   // if Callkit already exists then end Callkit wiht the callKitUUID
      //   console.log('end call uuid: ' + callKitUUID);
      //   RNCallKeep.endCall(callKitUUID);
      // }
    });

    RNCallKeep.addEventListener(
        'didDisplayIncomingCall',
        ({
           error,
           callUUID,
           handle,
           localizedCallerName,
           hasVideo,
           fromPushKit,
           payload,
         }) => {
          // Call back khi show callkit cho incoming call thanh cong, end fakeCall da show o day
          if (this.state.fakeCallIds.includes(callUUID)) {
            RNCallKeep.endCall(callUUID);
            var newFakeCallIds = this.state.fakeCallIds.filter(
                uuid => uuid != callUUID,
            );
            this.setState({fakeCallIds: newFakeCallIds});
            console.log(
                'END FAKE CALL, UUID: ' +
                callUUID +
                ' fakeCallIds: ' +
                this.state.fakeCallIds.toString,
            );
          }

          this.deleteSyncCallIfNeed();
        },
    );

    RNCallKeep.addEventListener('didActivateAudioSession', data => {
      this.setState({isActivateAudioSession: true});
      this.answerCallAction();
    });

    RNCallKeep.addEventListener(
        'didReceiveStartCallAction',
        ({handle, callUUID, name}) => {
        },
    );

    RNCallKeep.addEventListener(
        'didPerformSetMutedCallAction',
        ({muted, callUUID}) => {
          if (muted != this.state.isMute) {
            this._muteAction();
          }
        },
    );

    RNCallKeep.addEventListener('answerCall', ({callUUID}) => {
      if (this.state.syncCall == null) {
        return;
      }
      // Alert.alert('Người dùng click answer, Sync CallKitId: ' + this.state.syncCall.callkitId + ' callUUID: ' + callUUID.toLowerCase());

      if (callUUID != this.state.syncCall.callkitId) {
        return;
      }

      // Luu lai hanh dong answer cua nguoi dung
      var newSyncCall = this.state.syncCall;
      newSyncCall.answered = true;

      this.setState({
        // cacheAction: 1,
        syncCall: newSyncCall,
      });

      // Answer call neu can
      this.answerCallAction();
    });

    RNCallKeep.addEventListener('endCall', ({callUUID}) => {
      console.log('EVENT END CALLKIT, callUUID: ' + callUUID);

      if (this.state.syncCall == null) {
        console.log('EVENT END CALLKIT - syncCall = null');
        return;
      }

      if (
          this.state.syncCall.callkitId == '' ||
          callUUID != this.state.syncCall.callkitId
      ) {
        console.log(
            'EVENT END CALLKIT - uuid khac, callkitId: ' +
            this.state.syncCall.callkitId,
        );
        return;
      }

      // Cap nhat trang thai cho syncCall
      var newSyncCall = this.state.syncCall;
      newSyncCall.endedCallkit = true;
      newSyncCall.rejected = true;

      this.setState({
        syncCall: newSyncCall,
      });

      // StringeeCall van chua duoc end thi can end
      console.log(
          'EVENT END CALLKIT, syncCall: ' +
          this.state.syncCall +
          ' callId: ' +
          this.state.syncCall.callId +
          ' callCode: ' +
          this.state.syncCall.callCode,
      );
      if (
          this.state.syncCall.callId != '' &&
          this.state.syncCall.callCode != 3 &&
          this.state.syncCall.callCode != 4
      ) {
        if (this.state.answeredCall) {
          console.log('HANGUP CALL KHI END CALLKIT');
          this.refs.stringeeCall.hangup(
              this.state.syncCall.callId,
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
          console.log('REJECT CALL KHI END CALLKIT');
          this.refs.stringeeCall.reject(
              this.state.syncCall.callId,
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

        // var newSCall = this.state.syncCall;
        // newSCall.endedStringeeCall = true;
        // this.setState({
        //   syncCall: newSCall
        // });
      }

      this.deleteSyncCallIfNeed();
    });
  }

  /// MARK: - CONNECT EVENT HANDLER
  // The client connects to Stringee server
  _clientDidConnect = ({userId}) => {
    console.log('_clientDidConnect - ' + userId);
    this.setState({currentUserId: userId});

    /*
          Handle cho truong hop A goi B, nhung A end call rat nhanh, B nhan duoc push nhung khong nhan duoc incoming call
          ==> Sau khi ket noi den Stringee server 3s ma chua nhan duoc cuoc goi thi xoa Callkit Call va syncCall
        **/
    this.startEndTimeout();
    this.registerTokenForStringee();
    // Fix loi A goi B, nhung A End luon
  };

  // The client disconnects from Stringee server
  _clientDidDisConnect = () => {
    console.log('_clientDidDisConnect');
    this.stopEndTimeout();
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
    // Alert.alert('_callIncomingCall');

    this.setState({
      userId: from,
      callState: 'Incoming Call',
    });

    // Chua show callkit thi show
    if (this.state.syncCall == null) {
      console.log('Call + Show new call kit');
      var newSyncCall = new SyncCall();
      newSyncCall.callId = callId;
      newSyncCall.serial = serial;
      newSyncCall.callkitId = uuid.v1();
      newSyncCall.receivedStringeeCall = true;
      newSyncCall.isVideoCall = isVideoCall;

      // Callkit
      RNCallKeep.displayIncomingCall(
          newSyncCall.callkitId,
          'Stringee',
          fromAlias,
          'generic',
          true,
      );

      // Call screen
      this.setState({
        syncCall: newSyncCall,
        showCallingView: true,
      });

      this.refs.stringeeCall.initAnswer(callId, (status, code, message) => {
        console.log(message);
      });

      this.answerCallAction();
      return;
    }

    // Cuoc goi moi toi khong phai la current sync call
    // Alert.alert('INCOMING CALL, callId: ' + this.state.syncCall.callId + ' serial: ' + this.state.syncCall.serial);

    if (!this.state.syncCall.isThisCall(callId, serial)) {
      console.log(
          'INCOMING CALL -> REJECT, CUOC GOI MOI KHONG TRUNG VOI SYNC CALL',
      );
      this.refs.stringeeCall.reject(callId, (status, code, message) => {
      });
      return;
    }

    if (this.state.syncCall.rejected) {
      // nguoi dung da click nut reject cuoc goi
      console.log('INCOMING CALL -> REJECT, NGUOI DUNG DA REJECT CUOC GOI');
      this.refs.stringeeCall.reject(callId, (status, code, message) => {
      });
      return;
    }

    // Da show callkit => update UI
    if (this.state.syncCall.callkitId != '') {
      console.log('Call + Update');
      RNCallKeep.updateDisplay(this.state.syncCall.callkitId, fromAlias, '');

      var newSyncCall = this.state.syncCall;
      newSyncCall.callId = callId;
      newSyncCall.receivedStringeeCall = true;
      newSyncCall.isVideoCall = isVideoCall;

      this.setState({
        syncCall: newSyncCall,
        showCallingView: true,
      });

      this.refs.stringeeCall.initAnswer(callId, (status, code, message) => {
        console.log(message);
      });

      this.answerCallAction();
      return;
    }

    // Chua show callkit thi show
    var newSyncCall = this.state.syncCall;
    newSyncCall.callId = callId;
    newSyncCall.serial = serial;
    newSyncCall.callkitId = uuid.v1();
    newSyncCall.receivedStringeeCall = true;
    newSyncCall.isVideoCall = isVideoCall;

    // Callkit
    RNCallKeep.displayIncomingCall(
        newSyncCall.callkitId,
        'Stringee',
        fromAlias,
        'generic',
        true,
    );

    // Call screen
    this.setState({
      syncCall: newSyncCall,
      showCallingView: true,
    });

    this.refs.stringeeCall.initAnswer(callId, (status, code, message) => {
      console.log(message);
    });

    this.answerCallAction();
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
    if (this.state.syncCall != null) {
      var newSyncCall = this.state.syncCall;
      newSyncCall.callCode = code;

      // Neu la end hoac reject call thi cap nhat trang thai endedStringeeCall cho sync call
      if (code == 3 || code == 4) {
        newSyncCall.endedStringeeCall = true;
      }

      this.setState({
        callState: reason,
        syncCall: newSyncCall,
      });
    } else {
      this.setState({
        callState: reason,
      });
    }

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
        this.state.currentStringeeCallId,
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
  _didReceiveDtmfDigit = ({callId, dtmf}) => {
  };

  // Invoked when receives info from other clients
  _didReceiveCallInfo = ({callId, data}) => {
  };

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
    if (this.state.syncCall == null || this.state.syncCall.callId == '') {
      return;
    }

    this.refs.stringeeCall.mute(
        this.state.syncCall.callId,
        !this.state.isMute,
        (status, code, message) => {
          this.setState({isMute: !this.state.isMute});
          if (
              this.state.syncCall != null &&
              this.state.syncCall.callkitId != ''
          ) {
            RNCallKeep.setMutedCall(
                this.state.syncCall.callkitId,
                this.state.isMute,
            );
          }
        },
    );
  };

  _speakerAction = () => {
    if (this.state.syncCall == null || this.state.syncCall.callId == '') {
      return;
    }

    this.refs.stringeeCall.setSpeakerphoneOn(
        this.state.syncCall.callId,
        !this.state.isSpeaker,
        (status, code, message) => {
          this.setState({isSpeaker: !this.state.isSpeaker});
        },
    );
  };

  _enableVideoAction = () => {
    if (this.state.syncCall == null || this.state.syncCall.callId == '') {
      return;
    }

    this.refs.stringeeCall.enableVideo(
        this.state.syncCall.callId,
        !this.state.enableVideo,
        (status, code, message) => {
          this.setState({enableVideo: !this.state.enableVideo});
        },
    );
  };

  _switchCameraAction = () => {
    if (this.state.syncCall == null || this.state.syncCall.callId == '') {
      return;
    }

    this.refs.stringeeCall.switchCamera(
        this.state.syncCall.callId,
        (status, code, message) => {
          console.log(message);
        },
    );
  };

  async componentDidMount() {
    await this.refs.stringeeClient.connect(user1);
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  async componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  _handleAppStateChange = nextAppState => {
    var thisInstance = this;
    // if (
    //     this.state.appState.match(/inactive|background/) &&
    //     nextAppState === 'active'
    // ) {
      console.log('App has come to the foreground!');
      // RNCallKeep.checkSpeaker().then(
      //     function (speaker) {
      //       console.log('RNCallKeep.checkSpeaker ' + speaker);
      //       thisInstance.setState({isSpeaker: speaker});
      //     },
      //     function (error) {
      //       console.log(error.message);
      //     },
      // );
    // }

    this.setState({appState: nextAppState});
    console.log('App state ' + this.state.appState);
  };

  getClientId() {
    if (this.refs.stringeeClient != undefined) {
      return this.refs.stringeeClient.getId();
    }

    return ""
  }

  render() {
    return (
        <View style={styles.topCenteredView}>
          <Modal
              animationType="slide"
              transparent={false}
              visible={this.state.showCallingView}
              onRequestClose={() => {
                Alert.alert('Modal has been closed.');
              }}>
            {this.state.showCallingView && (
                <View style={{flex: 1}}>
                  <CallScreen
                      hasLocalStream={this.state.hasReceivedLocalStream}
                      hasRemoteStream={this.state.hasReceivedRemoteStream}
                      stringeeCallId={
                        this.state.syncCall != null ? this.state.syncCall.callId : ''
                      }
                      isVideoCall={this.state.syncCall != null ? this.state.syncCall.isVideoCall : false}
                      userId={this.state.userId}
                      isAnswered={
                        this.state.syncCall != null
                            ? this.state.syncCall.answered
                            : this.state.answeredCall
                      }
                      callState={this.state.callState}
                      endButtonHandler={() => {
                        if (
                            this.state.syncCall != null &&
                            this.state.syncCall.callId != ''
                        ) {
                          this.refs.stringeeCall.hangup(
                              this.state.syncCall.callId,
                              (status, code, message) => {
                                if (!status) {
                                  // That bai thi update UI
                                  this.endCallAndUpdateView();
                                }
                              },
                          );
                        } else {
                          // Update UI
                          this.endCallAndUpdateView();
                          console.log(
                              'KHONG THE END CALL, syncCall: ' +
                              this.state.syncCall +
                              ' callId: ' +
                              this.state.syncCall.callId,
                          );
                        }
                      }}
                      rejectButtonHandler={() => {
                        // Cap nhat trang that rejected cho syncCall
                        var newSyncCall = this.state.syncCall;
                        newSyncCall.rejected = true;
                        this.setState({
                          syncCall: newSyncCall,
                        });

                        if (
                            this.state.syncCall != null &&
                            this.state.syncCall.callId != ''
                        ) {
                          this.refs.stringeeCall.reject(
                              this.state.syncCall.callId,
                              (status, code, message) => {
                                if (!status) {
                                  // That bai thi update UI
                                  this.endCallAndUpdateView();
                                }
                              },
                          );
                        } else {
                          // Update UI
                          this.endCallAndUpdateView();
                          console.log(
                              'KHONG THE REJECT CALL, syncCall: ' +
                              this.state.syncCall +
                              ' callId: ' +
                              this.state.syncCall.callId,
                          );
                        }
                      }}
                      acceptButtonHandler={() => {
                        var newSyncCall = this.state.syncCall;
                        newSyncCall.answered = true;
                        this.setState({
                          syncCall: newSyncCall,
                        });

                        // Gọi hàm answer của Callkit rồi xử lý luồng như khi người dùng click answer từ callkit
                        RNCallKeep.answerIncomingCall(this.state.syncCall.callkitId)
                      }}
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
                width: '70%',
                color: 'black',
                borderColor: 'gray',
                borderWidth: 1,
                marginBottom: 30,
                textAlign: 'center',
              }}
              onChangeText={text => this.onChangeText(text)}
              placeholder={'userId hoặc số điện thoại'}
              value={this.state.toUserId}
          />

          <View style={styles.buttonWrapView}>
            <TouchableHighlight
                style={styles.callButton}
                onPress={() => {
                  this.callButtonClick(false);
                }}>
              <Text style={styles.textStyle}>Voice Call</Text>
            </TouchableHighlight>

            <TouchableHighlight
                style={styles.callButton}
                onPress={() => {
                  this.callButtonClick(true);
                }}>
              <Text style={styles.textStyle}>Video Call</Text>
            </TouchableHighlight>
          </View>

          <View>
            <StringeeClient
                ref="stringeeClient"
                eventHandlers={this.clientEventHandlers}
            />
            <StringeeCall
                ref="stringeeCall"
                clientId={this.getClientId()}
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
  buttonWrapView: {
    width: 280,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    width: 80,
  },
});

export default App;
