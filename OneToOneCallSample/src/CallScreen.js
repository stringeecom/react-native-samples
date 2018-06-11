import React, { Component } from "react";
import { AppRegistry } from "react-native";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
  PermissionsAndroid
} from "react-native";
import { each } from "underscore";

import { StringeeCall, StringeeVideoView } from "stringee-react-native";

var height = Dimensions.get("window").height;
var width = Dimensions.get("window").width;

const muteImg = require("../resource/mute.png");
const muteImg_selected = require("../resource/mute_selected.png");

const speakerImg = require("../resource/speaker.png");
const speakerImg_selected = require("../resource/speaker_selected.png");

const videoDisableImg = require("../resource/video_disable.png");
const videoEnableImg = require("../resource/video_enable.png");

checkAndroidPermissions = () =>
  new Promise((resolve, reject) => {
    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    ])
      .then(result => {
        const permissionsError = {};
        permissionsError.permissionsDenied = [];
        each(result, (permissionValue, permissionType) => {
          if (permissionValue === "denied") {
            permissionsError.permissionsDenied.push(permissionType);
            permissionsError.type = "Permissions error";
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

export default class CallScreen extends Component {
  constructor(props) {
    super(props);

    this.callEventHandlers = {
      onChangeSignalingState: this._callDidChangeSignalingState,
      onChangeMediaState: this._callDidChangeMediaState,
      onReceiveLocalStream: this._callDidReceiveLocalStream,
      onReceiveRemoteStream: this._callDidReceiveRemoteStream,
      onReceiveDtmfDigit: this._didReceiveDtmfDigit,
      onReceiveCallInfo: this._didReceiveCallInfo,
      onHandleOnAnotherDevice: this._didHandleOnAnotherDevice
    };
  }

  state = {
    userId: "UserId",
    callState: "Outgoing call",

    isVideoCall: false,
    callId: "",

    isMute: false,
    isSpeaker: false,

    isOutgoingCall: true,
    isShowOptionView: true,
    isShowDeclineBt: false,
    isShowEndBt: false,
    isShowAcceptBt: false,

    isEnableVideo: true,
    hasReceivedLocalStream: false,
    hasReceivedRemoteStream: false,

    answered: false,
    mediaConnected: false
  };

  componentWillMount() {}

  componentDidMount() {
    if (Platform.OS === "android") {
      checkAndroidPermissions()
        .then(() => {
          this.makeOrAnswerCall();
        })
        .catch(error => {
          alert("You must grant permissions to make a call " + error);
        });
    } else {
      this.makeOrAnswerCall();
    }
  }

  makeOrAnswerCall() {
    const { params } = this.props.navigation.state;
    const isOutgoingCall = params ? params.isOutgoingCall : false;
    const from = params ? params.from : "";
    const to = params ? params.to : "";
    const isVideoCall = params ? params.isVideoCall : false;

    console.log("isVideoCall " + isVideoCall);

    if (isOutgoingCall) {
      const myObj = {
        from: from,
        to: to,
        isVideoCall: isVideoCall,
        videoResolution: "NORMAL"
      };

      const parameters = JSON.stringify(myObj);

      this.setState({
        isShowDeclineBt: false,
        isShowEndBt: true,
        isShowAcceptBt: false,
        isShowOptionView: true,
        isOutgoingCall: isOutgoingCall,
        userId: to,
        isVideoCall: isVideoCall
      });
      this.refs.stringeeCall.makeCall(
        parameters,
        (status, code, message, callId, customDataFromYourServer) => {
          this.setState({ callId: callId });
          console.log(
            "status-" +
              status +
              " code-" +
              code +
              " message-" +
              message +
              " callId-" +
              callId +
              " customDataFromYourServer-" +
              customDataFromYourServer
          );
        }
      );
    } else {
      const callId = params ? params.callId : "";
      this.setState({
        isShowDeclineBt: true,
        isShowEndBt: false,
        isShowAcceptBt: true,
        isShowOptionView: false,
        isOutgoingCall: isOutgoingCall,
        userId: from,
        callState: "Incoming call",
        isVideoCall: isVideoCall,
        callId: callId
      });

      this.refs.stringeeCall.initAnswer(callId, (status, code, message) => {
        console.log(message);
      });
    }
  }

  // Signaling state
  _callDidChangeSignalingState = ({
    callId,
    code,
    reason,
    sipCode,
    sipReason
  }) => {
    console.log(
      "callId-" +
        callId +
        "code-" +
        code +
        " reason-" +
        reason +
        " sipCode-" +
        sipCode +
        " sipReason-" +
        sipReason
    );
    this.setState({ callState: reason });
    switch (code) {
      case 2:
        this.setState({ answered: true });
        if (this.mediaConnected) {
          this.setState({ callState: "Started" });
        }
        break;
      case 3:
        // busy
        if (Platform.OS === "android") {
          this.refs.stringeeCall.hangup(
            this.state.callId,
            (status, code, message) => {
              console.log(message);
              this.endCallAndDismissView();
            }
          );
        } else {
          this.endCallAndDismissView();
        }
        break;
      case 4:
        // end
        if (Platform.OS === "android") {
          this.refs.stringeeCall.hangup(
            this.state.callId,
            (status, code, message) => {
              console.log(message);
              this.endCallAndDismissView();
            }
          );
        } else {
          this.endCallAndDismissView();
        }
        break;
      default:
        break;
    }
  };

  // Media state
  _callDidChangeMediaState = ({ callId, code, description }) => {
    console.log(
      "callId-" + callId + "code-" + code + " description-" + description
    );
    switch (code) {
      case 0:
        // Connected
        this.setState({ mediaConnected: true });
        if (this.state.answered) {
          this.setState({ callState: "Started" });
        }
        break;
      case 1:
        // Disconnected
        break;
      default:
        break;
    }
  };

  _callDidReceiveLocalStream = ({ callId }) => {
    console.log("_callDidReceiveLocalStream " + callId);
    this.setState({ hasReceivedLocalStream: true });
  };

  _callDidReceiveRemoteStream = ({ callId }) => {
    console.log("_callDidReceiveRemoteStream " + callId);
    this.setState({ hasReceivedRemoteStream: true });
  };

  _didReceiveDtmfDigit = ({ callId, dtmf }) => {
    console.log("_didReceiveDtmfDigit " + callId + "***" + dtmf);
  };

  _didReceiveCallInfo = ({ callId, data }) => {
    console.log("_didReceiveCallInfo " + callId + "***" + data);
  };

  _didHandleOnAnotherDevice = ({ callId, code, description }) => {
    console.log(
      "_didHandleOnAnotherDevice " + callId + "***" + code + "***" + description
    );
    if (code == 2 || code == 3 || code == 4) {
      // Answered || Busy || End
      this.endCallAndDismissView();
    }
  };

  // Action
  _onDeclinePress = () => {
    console.log("_onDeclinePress");
    this.refs.stringeeCall.reject(
      this.state.callId,
      (status, code, message) => {
        console.log(message);
        this.endCallAndDismissView();
      }
    );
  };

  _onEndCallPress = () => {
    console.log("_onEndCallPress" + this.callId);
    this.refs.stringeeCall.hangup(
      this.state.callId,
      (status, code, message) => {
        console.log(message);
        this.endCallAndDismissView();
      }
    );
  };

  _onAcceptCallPress = () => {
    console.log("_onAcceptCallPress");
    this.refs.stringeeCall.answer(
      this.state.callId,
      (status, code, message) => {
        console.log(message);
        if (status) {
          this.setState({
            isShowOptionView: true,
            isShowDeclineBt: false,
            isShowEndBt: true,
            isShowAcceptBt: false
          });
        } else {
          this.endCallAndDismissView();
        }
      }
    );
  };

  _onMutePress = () => {
    this.refs.stringeeCall.mute(
      this.state.callId,
      !this.state.isMute,
      (status, code, message) => {
        console.log("_onMutePress" + message);
        if (status) {
          this.setState({ isMute: !this.state.isMute });
        }
      }
    );
  };

  _onSpeakerPress = () => {
    this.refs.stringeeCall.setSpeakerphoneOn(
      this.state.callId,
      !this.state.isSpeaker,
      (status, code, message) => {
        if (status) {
          this.setState({ isSpeaker: !this.state.isSpeaker });
        }
      }
    );
  };

  _onSwitchCameraPress = () => {
    this.refs.stringeeCall.switchCamera(
      this.state.callId,
      (status, code, message) => {}
    );
  };

  _onVideoPress = () => {
    if (this.state.isVideoCall) {
      this.refs.stringeeCall.enableVideo(
        this.state.callId,
        !this.state.isEnableVideo,
        (status, code, message) => {
          if (status) {
            this.setState({ isEnableVideo: !this.state.isEnableVideo });
          }
        }
      );
    }
  };

  renderMuteImage = () => {
    var imgSource = this.state.isMute ? muteImg_selected : muteImg;
    return <Image style={styles.button} source={imgSource} />;
  };

  renderSpeakerImage = () => {
    var imgSource = this.state.isSpeaker ? speakerImg_selected : speakerImg;
    return <Image style={styles.button} source={imgSource} />;
  };

  renderVideoImage = () => {
    var imgSource = this.state.isEnableVideo ? videoEnableImg : videoDisableImg;
    return <Image style={styles.button} source={imgSource} />;
  };

  endCallAndDismissView = () => {
    this.props.navigation.goBack();
  };

  render() {
    return (
      <View style={styles.container}>
        {this.state.isVideoCall &&
          this.state.callId !== "" &&
          this.state.hasReceivedRemoteStream && (
            <StringeeVideoView
              style={styles.remoteView}
              callId={this.state.callId}
              local={false}
            />
          )}

        {this.state.hasReceivedLocalStream &&
          this.state.callId !== "" &&
          this.state.isVideoCall && (
            <StringeeVideoView
              style={styles.localView}
              callId={this.state.callId}
              local={true}
            />
          )}

        {this.state.isVideoCall && (
          <TouchableOpacity
            onPress={this._onSwitchCameraPress}
            style={styles.camera}
          >
            <Image
              source={require("../resource/camera_switch.png")}
              style={{ width: 40, height: 40 }}
            />
          </TouchableOpacity>
        )}

        <Text style={styles.userId}>{this.state.userId}</Text>
        <Text style={styles.callState}>{this.state.callState}</Text>

        {this.state.isShowOptionView ? (
          <View style={styles.callOptionContainer}>
            <TouchableOpacity onPress={this._onMutePress}>
              {this.renderMuteImage()}
            </TouchableOpacity>

            {this.state.isVideoCall && (
              <TouchableOpacity onPress={this._onVideoPress}>
                {this.renderVideoImage()}
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={this._onSpeakerPress}>
              {this.renderSpeakerImage()}
            </TouchableOpacity>
          </View>
        ) : null}

        {this.state.isShowEndBt && (
          <View style={styles.callActionContainerEnd}>
            {this.state.isShowDeclineBt ? (
              <TouchableOpacity onPress={this._onDeclinePress}>
                <Image
                  source={require("../resource/end_call.png")}
                  style={styles.button}
                />
              </TouchableOpacity>
            ) : null}

            {this.state.isShowEndBt ? (
              <TouchableOpacity onPress={this._onEndCallPress}>
                <Image
                  source={require("../resource/end_call.png")}
                  style={styles.button}
                />
              </TouchableOpacity>
            ) : null}

            {this.state.isShowAcceptBt ? (
              <TouchableOpacity onPress={this._onAcceptCallPress}>
                <Image
                  source={require("../resource/accept_call.png")}
                  style={styles.button}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {!this.state.isShowEndBt && (
          <View style={styles.callActionContainer}>
            {this.state.isShowDeclineBt ? (
              <TouchableOpacity onPress={this._onDeclinePress}>
                <Image
                  source={require("../resource/end_call.png")}
                  style={styles.button}
                />
              </TouchableOpacity>
            ) : null}

            {this.state.isShowEndBt ? (
              <TouchableOpacity onPress={this._onEndCallPress}>
                <Image
                  source={require("../resource/end_call.png")}
                  style={styles.button}
                />
              </TouchableOpacity>
            ) : null}

            {this.state.isShowAcceptBt ? (
              <TouchableOpacity onPress={this._onAcceptCallPress}>
                <Image
                  source={require("../resource/accept_call.png")}
                  style={styles.button}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        <StringeeCall
          ref="stringeeCall"
          eventHandlers={this.callEventHandlers}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#00A6AD",
    position: "relative"
  },

  callOptionContainer: {
    height: 70,
    width: 280,
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    bottom: 200
  },

  callActionContainer: {
    position: "absolute",
    height: 70,
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },

  callActionContainerEnd: {
    position: "absolute",
    height: 70,
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },

  button: {
    width: 70,
    height: 70
  },

  userId: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 130
  },

  callState: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 20
  },
  localView: {
    backgroundColor: "black",
    position: "absolute",
    top: 20,
    right: 20,
    width: 100,
    height: 100,
    zIndex: 1
  },
  remoteView: {
    backgroundColor: "black",
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 0
  },
  camera: {
    position: "absolute",
    top: 40,
    left: 0,
    width: 40,
    height: 40,
    zIndex: 2
  }
});
