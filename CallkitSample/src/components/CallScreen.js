"use strict";

import React, { Component, PureComponent } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert
} from "react-native";

import { StringeeCall, StringeeVideoView } from "stringee-react-native";

import RNCallKit from "react-native-callkit";
import uuid from "uuid";

import VoipPushNotification from "react-native-voip-push-notification";

const height = Dimensions.get("window").height;
const width = Dimensions.get("window").width;

const muteImg = require("../images/mute.png");
const muteImg_selected = require("../images/mute_selected.png");

const speakerImg = require("../images/speaker.png");
const speakerImg_selected = require("../images/speaker_selected.png");

const videoDisableImg = require("../images/video_disable.png");
const videoEnableImg = require("../images/video_enable.png");

var _uuid = "";
var hasAnswered = false;

export default class CallScreen extends PureComponent {
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

    this.onRNCallKitPerformAnswerCallAction = this.onRNCallKitPerformAnswerCallAction.bind(
      this
    );
    this.onRNCallKitPerformEndCallAction = this.onRNCallKitPerformEndCallAction.bind(
      this
    );
    this.onRNCallKitDidActivateAudioSession = this.onRNCallKitDidActivateAudioSession.bind(
      this
    );

    // Add RNCallKit Events
    RNCallKit.addEventListener(
      "answerCall",
      this.onRNCallKitPerformAnswerCallAction
    );
    RNCallKit.addEventListener("endCall", this.onRNCallKitPerformEndCallAction);
    RNCallKit.addEventListener(
      "didActivateAudioSession",
      this.onRNCallKitDidActivateAudioSession
    );
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

  componentWillMount() {
    // console.log("call - componentWillMount");
  }

  componentDidMount() {
    const { params } = this.props.navigation.state;
    const isOutgoingCall = params ? params.isOutgoingCall : false;
    const from = params ? params.from : "";
    const to = params ? params.to : "";
    const isVideoCall = params ? params.isVideoCall : false;

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
        (status, code, message, callId) => {
          this.setState({ callId: callId });
          console.log(
            "status-" +
              status +
              " code-" +
              code +
              " message-" +
              message +
              callId
          );
        }
      );
    } else {
      const callId = params ? params.callId : "";

      this.refs.stringeeCall.initAnswer(callId, (status, code, message) => {
        console.log(message);
        if (status) {
          const majorVersionIOS = parseInt(Platform.Version);

          if (majorVersionIOS >= 10) {
            // Nếu thiết bị có iOS version >= 10 thì có thể sử dụng callkit để show native incoming call
            this.onIncomingCall(from);
          } else {
            // Nếu thiết bị có iOS version < 10 thì phải dùng local push notification để thông báo có cuộc gọi đến
            this.presentLocalPush(from);
            this.timer = this._interval = setInterval(() => {
              this.presentLocalPush(from);
            }, 8000);
          }
        }
      });

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
    }
  }

  componentWillUnmount() {
    // Remove RNCallKit Events
    RNCallKit.removeEventListener(
      "didReceiveStartCallAction",
      this.onRNCallKitDidReceiveStartCallAction
    );
    RNCallKit.removeEventListener(
      "answerCall",
      this.onRNCallKitPerformAnswerCallAction
    );
    RNCallKit.removeEventListener(
      "endCall",
      this.onRNCallKitPerformEndCallAction
    );
    RNCallKit.removeEventListener(
      "didActivateAudioSession",
      this.onRNCallKitDidActivateAudioSession
    );
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
        this.endCallAndDismissView();
        break;
      case 4:
        // end
        this.endCallAndDismissView();
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
    console.log("$$$$$$$$$$$ end " + this.refs.stringeeCall);

    this.refs.stringeeCall.hangup(
      this.state.callId,
      (status, code, message) => {
        console.log(message);
        this.endCallAndDismissView();
      }
    );
  };

  _onAcceptCallPress = () => {
    hasAnswered = true;
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

  endCallAndDismissView() {
    clearInterval(this.timer);
    this.onHangUpCall();
    this.props.navigation.goBack();
  }

  /* CALLKIT ====================================> BEGIN */

  // onRNCallKitDidReceiveStartCallAction(data) {
  //   // Sự kiện gọi đi..có thể bắt đầu từ việc ấn call recents hoặc siri..
  //   _uuid = uuid.v4();
  //   RNCallKit.startCall(_uuid, data.handle);
  // }

  onRNCallKitPerformAnswerCallAction({ callUUID }) {
    console.log("onRNCallKitPerformAnswerCallAction " + callUUID);
    // Người dùng ấn answer ở màn hình native incoming call. Lúc này AudioSession sẽ được active => khi active xong mới answer stringeeCall
  }

  onRNCallKitPerformEndCallAction(data) {
    console.log("onRNCallKitPerformEndCallAction");
    /* Người dùng ấn endcall ở màn hình incoming call, outgoing call hoặc đang nghe...
        ==> Trường hợp reject call hay end call thì đều gọi hàm này
        ==> Cần phân biệt để goi hàm cho đúng
    */
    if (!this.state.isOutgoingCall && !hasAnswered) {
      this._onDeclinePress();
    } else {
      this._onEndCallPress();
    }
  }

  onRNCallKitDidActivateAudioSession(data) {
    // AudioSession đã được active, có thể phát nhạc chờ nếu là outgoing call, answer call nếu là incoming call.
    console.log("DID ACTIVE AUDIO");
    this._onAcceptCallPress();
  }

  onIncomingCall(name) {
    // Khởi tạo uuid - mã định danh cho cuộc gọi. Show native incoming call với info
    _uuid = uuid.v4();
    RNCallKit.displayIncomingCall(_uuid, name);
  }

  onOutgoingCall(name) {
    // Khởi tạo uuid - mã định danh cho cuộc gọi. Show native outgoing call với info
    _uuid = uuid.v4();
    RNCallKit.startCall(_uuid, name);
  }

  onHangUpCall() {
    // Kết thúc cuộc gọi đang hiển thị giao diện native với callkit.
    if (_uuid != "") {
      RNCallKit.endCall(_uuid);
      _uuid = "";
    }
  }

  /* CALLKIT ====================================> END */

  presentLocalPush(from) {
    VoipPushNotification.presentLocalNotification({
      alertBody: "Bạn đã nhận được cuộc gọi đến từ " + from,
      soundName: "incoming_call.aif"
    });
  }

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
              source={require("../images/camera_switch.png")}
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
                  source={require("../images/end_call.png")}
                  style={styles.button}
                />
              </TouchableOpacity>
            ) : null}

            {this.state.isShowEndBt ? (
              <TouchableOpacity onPress={this._onEndCallPress}>
                <Image
                  source={require("../images/end_call.png")}
                  style={styles.button}
                />
              </TouchableOpacity>
            ) : null}

            {this.state.isShowAcceptBt ? (
              <TouchableOpacity onPress={this._onAcceptCallPress}>
                <Image
                  source={require("../images/accept_call.png")}
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
                  source={require("../images/end_call.png")}
                  style={styles.button}
                />
              </TouchableOpacity>
            ) : null}

            {this.state.isShowEndBt ? (
              <TouchableOpacity onPress={this._onEndCallPress}>
                <Image
                  source={require("../images/end_call.png")}
                  style={styles.button}
                />
              </TouchableOpacity>
            ) : null}

            {this.state.isShowAcceptBt ? (
              <TouchableOpacity onPress={this._onAcceptCallPress}>
                <Image
                  source={require("../images/accept_call.png")}
                  style={styles.button}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        <StringeeCall
          ref="stringeeCall"
          // ref={ref => {
          //   this.stringeeCall = ref;
          // }}
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
