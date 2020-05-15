import React, { Component, useState } from "react";
import { Alert, Modal, StyleSheet, Text, TouchableHighlight, View, TextInput } from "react-native";
import { StringeeClient, StringeeCall } from "stringee-react-native";
import RNCallKeep from 'react-native-callkeep';
import VoipPushNotification from "react-native-voip-push-notification";
import uuid from 'react-native-uuid';
import CallScreen from './src/CallScreen';

const options = {
  ios: {
    appName: 'Stringee',
  },
  android: {
    alertTitle: 'Permissions required',
    alertDescription: 'This application needs to access your phone accounts',
    cancelButton: 'Cancel',
    okButton: 'ok',
  }
};

class App extends Component {
  state = {
    toUserId: "",
    currentUserId: "",
    currentStringeeCallId: "",
    currentCallKitId: "",

    isAnswered: false,
    cacheAction: 0, // 0: Không có, 1: Đã bấm answer, 2: Đã bấm end

    showCallingView: false,
    hasReceivedLocalStream: false,
    hasReceivedRemoteStream: false,
  };

  callButtonClick = () => {

    const myObj = {
      from: this.state.currentUserId, // caller
      to: this.state.toUserId, // callee
      isVideoCall: true, // Cuộc gọi là video call hoặc voice call 
      videoResolution: 'NORMAL' // chất lượng hình ảnh 'NORMAL' hoặc 'HD'. Mặc định là 'NORMAL'.
    };

    const parameters = JSON.stringify(myObj);

    this.refs.stringeeCall.makeCall(parameters, (status, code, message, callId) => {
      console.log('status-' + status + ' code-' + code + ' message-' + message + 'callId-' + callId);
      if (status) {
        this.setState({ currentStringeeCallId: callId });
        this.setState({ showCallingView: true });
      } else {

      }
    })
  }

  endcallAction = () => {
    if (this.state.currentCallKitId != "") {
      RNCallKeep.endCall(this.state.currentCallKitId);
      this.setState({ currentCallKitId: "" });
    }

    this.setState({ showCallingView: false })
    this.setState({ hasReceivedLocalStream: false })
    this.setState({ hasReceivedRemoteStream: false })
  }

  onChangeText = (text) => {
    this.setState({ toUserId: text });
    console.log(text);
  }

  constructor(props) {
    super(props);
    console.disableYellowBox = true

    RNCallKeep.setup(options);

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
      onHandleOnAnotherDevice: this._didHandleOnAnotherDevice
    };


    VoipPushNotification.requestPermissions();

    VoipPushNotification.addEventListener('register', (token) => {
      // --- send token to your apn provider server
      console.log("Thinhnt register VOIP: " + token);

      // send token to your apn provider server
      this.refs.stringeeClient.registerPush(
        token,
        false, // isProduction: false: In development, true: In Production.
        true, // (iOS) isVoip: true: Voip PushNotification. Stringee supports this push notification.
        (status, code, message) => {
          console.log("Thinhnt Stringee register VOIP: " + message);
        }
      );
    });

    VoipPushNotification.addEventListener('notification', (notification) => {
      callKitUUID = notification.getData().uuid;
      if (this.state.currentCallKitId == "") {
        console.log("Thinhnt set uuid: " + callKitUUID);
        this.setState({ currentCallKitId: callKitUUID });
      } else {
        console.log("Thinhnt end call uuid: " + callKitUUID);
        RNCallKeep.endCall(callKitUUID);
      }
    });


    RNCallKeep.addEventListener('didReceiveStartCallAction', ({ handle, callUUID, name }) => {

    });

    RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
      if (callUUID != this.state.currentCallKitId) { return; }

      if (this.state.currentStringeeCallId == "") {
        this.setState({ cacheAction: 1 });
      } else {
        this.refs.stringeeCall.answer(this.state.currentStringeeCallId, (status, code, message) => {
          console.log(message);
          this.setState({ isAnswered: true });
          if (status) {
            // Sucess
          } else {
            // Fail
          }
        });
      }
    });

    RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
      if (callUUID != this.state.currentCallKitId) { return; }
      
      if (this.state.currentStringeeCallId == "") {
        this.setState({ cacheAction: 2 });
      } else {
        if (this.state.isAnswered) {
          this.refs.stringeeCall.hangup(this.state.currentStringeeCallId, (status, code, message) => {
            console.log(message);
            if (status) {
              // Sucess
            } else {
              // Fail
            }
          });
        } else {
          this.refs.stringeeCall.reject(this.state.currentStringeeCallId, (status, code, message) => {
            console.log(message);
            if (status) {
              // Sucess
            } else {
              // Fail
            }
          });
        }
      }

      this.setState({ currentCallKitId: "" });
    });

  }

  /// MARK: - CONNECT EVENT HANDLER
  // The client connects to Stringee server
  _clientDidConnect = ({ userId }) => {
    console.log('_clientDidConnect - ' + userId);
    this.setState({ currentUserId: userId });

    VoipPushNotification.registerVoipToken();
  }

  // The client disconnects from Stringee server
  _clientDidDisConnect = () => {
    console.log('_clientDidDisConnect');
  }

  // The client fails to connects to Stringee server
  _clientDidFailWithError = () => {
    console.log('_clientDidFailWithError');
  }

  // Access token is expired. A new access token is required to connect to Stringee server
  _clientRequestAccessToken = () => {
    console.log("_clientRequestAccessToken");
    // this.refs.client.connect('NEW_YOUR_ACCESS_TOKEN');
  }

  // IncomingCall event
  _callIncomingCall = ({ callId, from, to, fromAlias, toAlias, callType, isVideoCall }) => {
    console.log("IncomingCallId-" + callId + ' from-' + from + ' to-' + to + ' fromAlias-' + fromAlias + ' toAlias-' + toAlias + ' isVideoCall-' + isVideoCall + 'callType-' + callType);

    this.refs.stringeeCall.initAnswer(callId, (status, code, message) => {
      console.log(message);
    });
    
    this.setState({ currentStringeeCallId: callId });

    switch (this.state.cacheAction) {
      case 0: // Trường hợp bình thường
        this.setState({ showCallingView: true });
        if (this.state.currentCallKitId != "") {
          RNCallKeep.updateDisplay(this.state.currentCallKitId, fromAlias, "")
          console.log("Thinhnt: Call + UPdate");
        } else {
          var callKitUUID = uuid.v1();
          this.setState({ currentCallKitId: callKitUUID });
          RNCallKeep.displayIncomingCall(callKitUUID, "Stringee", fromAlias, "generic", true);
          console.log("Thinhnt: Call + Show new call kit");
        }
        break;

      case 1: // Trường hợp đã bấm answer
        this.setState({ showCallingView: true });
        this.refs.stringeeCall.answer(this.state.currentStringeeCallId, (status, code, message) => {
          console.log(message);
          this.setState({ isAnswered: true });
        });
        break;

      case 2: // Trường hợp đã bấm Reject
        this.refs.stringeeCall.reject(this.state.currentStringeeCallId, (status, code, message) => {
          console.log(message);
        });
        break;

      default:
        break;
    }
  }

  /// MARK: - CALL EVENT HANDLER
  // Invoked when the call signaling state changes
  _callDidChangeSignalingState = ({ callId, code, reason, sipCode, sipReason }) => {
    console.log("Thinhnt _callDidChangeSignalingState " + 'callId-' + callId + 'code-' + code + ' reason-' + reason + ' sipCode-' + sipCode + ' sipReason-' + sipReason);
    switch (code) {
      case 0:

        break;
      case 1:

        break;
      case 2:

        break;
      case 3:
        this.endcallAction()
        break;
      case 4:
        this.endcallAction()
        break;

      default:
        break;
    }
  }

  // Invoked when the call media state changes
  _callDidChangeMediaState = ({ callId, code, description }) => {
    console.log('callId-' + callId + 'code-' + code + ' description-' + description);

    this.refs.stringeeCall.setSpeakerphoneOn(this.state.currentStringeeCallId, true, (status, code, message) => {
      console.log(message);
    });

  }

  // Invoked when the local stream is available    
  _callDidReceiveLocalStream = ({ callId }) => {
    console.log('_callDidReceiveLocalStream ' + callId);
    this.setState({ hasReceivedLocalStream: true });
  }
  // Invoked when the remote stream is available
  _callDidReceiveRemoteStream = ({ callId }) => {
    console.log('_callDidReceiveRemoteStream ' + callId);
    this.setState({ hasReceivedRemoteStream: true });
  }

  // Invoked when receives a DMTF
  _didReceiveDtmfDigit = ({ callId, dtmf }) => {
    console.log('_didReceiveDtmfDigit ' + callId + "***" + dtmf);
  }

  // Invoked when receives info from other clients
  _didReceiveCallInfo = ({ callId, data }) => {
    console.log('_didReceiveCallInfo ' + callId + "***" + data);
  }

  // Invoked when the call is handled on another device
  _didHandleOnAnotherDevice = ({ callId, code, description }) => {
    console.log('_didHandleOnAnotherDevice ' + callId + "***" + code + "***" + description);
  }

  async componentDidMount() {
    //user1
    // token = "eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTSzRPNEVRa2J0VDdkTFBFSzBBbGJOTEdTaGpUcjBnaVFOLTE1ODkyNTQ1NzkiLCJpc3MiOiJTSzRPNEVRa2J0VDdkTFBFSzBBbGJOTEdTaGpUcjBnaVFOIiwiZXhwIjoxNTkxODQ2NTc5LCJ1c2VySWQiOiJ1c2VyMSJ9.A9Cd8IMYG-W_o0Wa266xfiA86WgsZyRKWuSLiylsZK8"

    //user2
    token = "eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTSzRPNEVRa2J0VDdkTFBFSzBBbGJOTEdTaGpUcjBnaVFOLTE1ODkyNTQ1OTkiLCJpc3MiOiJTSzRPNEVRa2J0VDdkTFBFSzBBbGJOTEdTaGpUcjBnaVFOIiwiZXhwIjoxNTkxODQ2NTk5LCJ1c2VySWQiOiJ1c2VyMiJ9.IhqYvSs_af1TbU4Fh73ZZNtNQYzar5Y52yru2okhX6o"

    console.log("Thinhnt connecting");
    await this.refs.stringeeClient.connect(token);

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
            Alert.alert("Modal has been closed.");
          }}
        >
          {this.state.showCallingView && <View style={{ flex: 1 }} >
            <CallScreen
              hasLocalStream={this.state.hasReceivedLocalStream}
              hasRemoteStream={this.state.hasReceivedRemoteStream}
              stringeeCallId={this.state.currentStringeeCallId}
              endButtonHandler={() => {
                this.endcallAction()
                this.refs.stringeeCall.hangup(this.state.currentStringeeCallId, (status, code, message) => {
                  console.log(message);
                });
              }}
            />
          </View> }
        </Modal>

        <Text style={{ height: 40, marginBottom: 10, textAlign: "center" }}>
          {this.state.currentUserId}
        </Text>

        <TextInput
          style={{ height: 40, width: 200, color: 'black', borderColor: 'gray', borderWidth: 1, marginBottom: 30, textAlign: "center" }}
          onChangeText={text => this.onChangeText(text)}
          value={this.state.toUserId}
        />

        <TouchableHighlight
          style={styles.openButton}
          onPress={() => {
            this.callButtonClick();
          }}
        >
          <Text style={styles.textStyle}>Call</Text>
        </TouchableHighlight>

        <View>
          <StringeeClient ref="stringeeClient" eventHandlers={this.clientEventHandlers} />
          <StringeeCall ref="stringeeCall" eventHandlers={this.callEventHandlers}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },

  topCenteredView: {
    flex: 1,
    alignItems: "center",
    marginTop: 150
  },

  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  openButton: {
    backgroundColor: "green",
    borderRadius: 20,
    padding: 10,
    elevation: 2
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    width: 80
  },
});

export default App;