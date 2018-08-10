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

import { StringeeRoom, StringeeVideoView } from "stringee-react-native";

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

    this.roomEventHandlers = {
      onRoomConnect: this._onRoomConnect,
      onRoomDisConnect: this._onRoomDisConnect,
      onRoomError: this._onRoomError,
      onStreamAdd: this._onStreamAdd,
      onStreamRemove: this._onStreamRemove
    };
  }

  state = {
    roomId: "",
    remoteStreamId: "",
    localStreamId: "",
    isMute: false,
    isSpeaker: true,
    isEnableVideo: true,
    hasPublishedLocalStream: false,
    remoteStreams: new Map()
  };

  componentWillMount() {}

  componentDidMount() {
    if (Platform.OS === "android") {
      checkAndroidPermissions()
        .then(() => {
          this.makeOrJoinRoom();
        })
        .catch(error => {
          alert("You must grant permissions to make a call " + error);
        });
    } else {
      this.makeOrJoinRoom();
    }
  }

  makeOrJoinRoom() {
    const { params } = this.props.navigation.state;
    const roomId = params.roomId;
    const isRoomMaking = params.isRoomMaking;

    if (isRoomMaking) {
      this.refs.stringeeRoom.makeRoom((status, code, message, roomId) => {
        this.setState({ roomId: roomId });
        console.log(
          "MakeRoom - status:" +
            status +
            ", code:" +
            code +
            ", message:" +
            message +
            ", roomId:" +
            roomId
        );
      });
    } else {
      this.refs.stringeeRoom.joinRoom(roomId, (status, code, message) => {
        this.setState({ roomId: roomId });
        console.log(
          "joinRoom - status:" +
            status +
            ", code:" +
            code +
            ", message:" +
            message +
            ", roomId:" +
            roomId
        );
      });
    }
  }

  // TODO: Room events

  _onRoomConnect = ({ roomId, streams }) => {
    console.log("_onRoomConnect " + roomId + ", streams:" + streams);
    const myObj = { videoResolution: "NORMAL" };
    const config = JSON.stringify(myObj);

    // Subscribe stream cua nguoi khac
    streams.map(stream => {
      console.log("userId " + stream.userId + ", streamId:" + stream.streamId);
      this.refs.stringeeRoom.subscribe(
        roomId,
        stream.streamId,
        (status, message) => {
          console.log("status " + status + ", message:" + message);
          this.setState({
            remoteStreams: new Map([
              ...this.state.remoteStreams,
              [stream.streamId, stream]
            ])
          });
        }
      );
    });

    // Publish local stream cua minh
    this.refs.stringeeRoom.publishLocalStream(
      roomId,
      config,
      (status, code, message, streamId) => {
        console.log(
          "publishLocalStream -- status:" +
            status +
            ", code:" +
            code +
            ", message:" +
            message +
            ", streamId:" +
            streamId
        );
        this.setState({
          hasPublishedLocalStream: true,
          localStreamId: streamId
        });
      }
    );
  };

  _onRoomDisConnect = ({ roomId }) => {
    console.log("_onRoomDisConnect " + roomId);
  };

  _onRoomError = ({ code, message }) => {
    console.log("_onRoomError " + code + "--" + message);
  };

  _onStreamAdd = ({ roomId, stream }) => {
    console.log("_onStreamAdd " + roomId + "--" + stream);
    this.refs.stringeeRoom.subscribe(
      roomId,
      stream.streamId,
      (status, message) => {
        console.log("status " + status + ", message:" + message);
        this.setState({
          remoteStreams: new Map([
            ...this.state.remoteStreams,
            [stream.streamId, stream]
          ])
        });
      }
    );
  };

  _onStreamRemove = ({ roomId, stream }) => {
    console.log("_onStreamRemove " + roomId + "--" + stream);
    const streams = this.state.remoteStreams;
    streams.delete(stream.streamId);
    this.setState({ remoteStreams: new Map([...streams]) });
  };

  // TODO: Action

  outRoomPress = () => {
    this.refs.stringeeRoom.destroy(this.state.roomId, (status, message) => {
      console.log("destroy " + status + "--" + message);
    });
    this.endCallAndDismissView();
  };

  _onMutePress = () => {
    this.refs.stringeeRoom.mute(!this.state.isMute);
    this.setState({ isMute: !this.state.isMute });
  };

  _onSpeakerPress = () => {
    this.refs.stringeeRoom.setSpeakerphoneOn(!this.state.isSpeaker);
    this.setState({
      isSpeaker: !this.state.isSpeaker
    });
  };

  _onSwitchCameraPress = () => {
    this.refs.stringeeRoom.switchCamera();
  };

  _onVideoPress = () => {
    this.refs.stringeeRoom.turnOnCamera(
      !this.state.isEnableVideo,
      (status, message) => {
        if (status) {
          this.setState({
            isEnableVideo: !this.state.isEnableVideo
          });
        }
      }
    );
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
        {this.state.hasPublishedLocalStream && (
          <StringeeVideoView
            style={styles.localView}
            local={true}
            streamId={this.state.localStreamId}
            overlay={false}
          />
        )}

        <Text style={styles.roomId}>{this.state.roomId}</Text>

        <View style={styles.remoteGrid}>
          {Array.from(this.state.remoteStreams, ([streamId, stream]) => {
            return (
              <StringeeVideoView
                key={streamId}
                style={styles.remoteView}
                streamId={streamId}
                local={false}
                overlay={true}
              />
            );
          })}
        </View>

        <TouchableOpacity
          onPress={this._onSwitchCameraPress}
          style={styles.camera}
        >
          <Image
            source={require("../resource/camera_switch.png")}
            style={{ width: 40, height: 40 }}
          />
        </TouchableOpacity>

        <View style={styles.callOptionContainer}>
          <TouchableOpacity onPress={this._onMutePress}>
            {this.renderMuteImage()}
          </TouchableOpacity>

          <TouchableOpacity onPress={this._onVideoPress}>
            {this.renderVideoImage()}
          </TouchableOpacity>

          <TouchableOpacity onPress={this._onSpeakerPress}>
            {this.renderSpeakerImage()}
          </TouchableOpacity>
        </View>

        <View style={styles.callActionContainerEnd}>
          <TouchableOpacity onPress={this.outRoomPress}>
            <Image
              source={require("../resource/end_call.png")}
              style={styles.button}
            />
          </TouchableOpacity>
        </View>

        <StringeeRoom
          ref="stringeeRoom"
          eventHandlers={this.roomEventHandlers}
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
    bottom: 150
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
    bottom: 30,
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

  roomId: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10
  },

  localView: {
    backgroundColor: "red",
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 0
  },

  remoteGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap"
  },

  remoteView: {
    marginTop: 30,
    marginLeft: 10,
    marginRight: 10,
    width: 100,
    height: 120
  },
  camera: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 40,
    height: 40,
    zIndex: 2
  }
});
