import React, {Component, useState} from 'react';
import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
} from 'react-native';
import {
  StringeeClient,
  StringeeCall,
  StringeeVideoView,
  StringeeRemoteVideoView,
} from 'stringee-react-native';

var height = Dimensions.get('window').height;
var width = Dimensions.get('window').width;

const muteImg = require('../resource/mute.png');
const muteImg_selected = require('../resource/mute_selected.png');

const speakerImg = require('../resource/speaker.png');
const speakerImg_selected = require('../resource/speaker_selected.png');

const videoDisableImg = require('../resource/video_disable.png');
const videoEnableImg = require('../resource/video_enable.png');

class CallScreen extends Component {
  state = {
    userId: this.props.userId,
    callState: this.props.signalState,

    callId: '',

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
    mediaConnected: false,
  };

  async componentDidMount() {
    console.log('userId: ' + this.state.userId);
    console.log('callState: ' + this.state.callState);
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.localView}>
          {this.props.hasLocalStream && this.props.stringeeCallId != '' && (
            <StringeeVideoView
              style={{flex: 1}}
              callId={this.props.stringeeCallId}
              streamId=""
              local={true}
            />
          )}
        </View>

        <View style={styles.remoteView}>
          {this.props.hasRemoteStream && this.props.stringeeCallId != '' && (
            <StringeeVideoView
              style={{flex: 1}}
              callId={this.props.stringeeCallId}
              streamId=""
              local={false}
            />
          )}
        </View>

        <TouchableOpacity
          onPress={this._onSwitchCameraPress}
          style={styles.camera}>
          <Image
            source={require('../resource/camera_switch.png')}
            style={styles.switchCamera}
          />
        </TouchableOpacity>

        <Text style={styles.userId}>{this.state.userId}</Text>
        <Text style={styles.callState}>{this.state.callState}</Text>

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

        <View style={styles.callActionContainer}>
          {this.state.answered ? (
            <TouchableOpacity onPress={this._onDeclinePress}>
              <Image
                source={require('../resource/end_call.png')}
                style={styles.button}
              />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => {
              console.log('end button');
              this.props.endButtonHandler();
            }}>
            <Image
              source={require('../resource/end_call.png')}
              style={styles.button}
            />
          </TouchableOpacity>

          {this.state.answered ? (
            <TouchableOpacity invisible onPress={this._onAcceptCallPress}>
              <Image
                source={require('../resource/accept_call.png')}
                style={styles.button}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  renderMuteImage = () => {
    var imgSource = muteImg;
    return <Image style={styles.button} source={imgSource} />;
  };

  renderSpeakerImage = () => {
    var imgSource = speakerImg;
    return <Image style={styles.button} source={imgSource} />;
  };

  renderVideoImage = () => {
    var imgSource = videoDisableImg;
    return <Image style={styles.button} source={imgSource} />;
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#00A6AD',
    position: 'relative',
  },

  callOptionContainer: {
    height: 70,
    width: 280,
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 200,
  },

  callActionContainer: {
    backgroundColor: '#00A6AD',
    position: 'absolute',
    height: 70,
    bottom: 40,
    left: 40,
    right: 40,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  button: {
    width: 70,
    height: 70,
  },

  userId: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 130,
  },

  callState: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
  },
  localView: {
    backgroundColor: 'grey',
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
  camera: {
    position: 'absolute',
    top: 40,
    left: 0,
    width: 40,
    height: 40,
    zIndex: 2,
  },
  switchCamera: {
    position: 'absolute',
    top: 10,
    left: 20,
    width: 40,
    height: 40,
    zIndex: 2,
  },
});

export default CallScreen;
