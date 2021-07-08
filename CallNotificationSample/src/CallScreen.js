import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import {StringeeVideoView} from 'stringee-react-native';
// import RNCallKeep from 'react-native-callkeep';
// import App from '../App';

var height = Dimensions.get('window').height;
var width = Dimensions.get('window').width;

const muteImg = require('../resource/mute.png');
const muteImg_selected = require('../resource/mute_selected.png');

const speakerImg = require('../resource/speaker.png');
const speakerImg_selected = require('../resource/speaker_selected.png');

const videoDisableImg = require('../resource/video_disable.png');
const videoEnableImg = require('../resource/video_enable.png');

class CallScreen extends Component {
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
              overlay={true}
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
          onPress={this.props.switchCameraHandler}
          style={styles.camera}>
          <Image
            source={require('../resource/camera_switch.png')}
            style={styles.switchCamera}
          />
        </TouchableOpacity>

        <Text style={styles.userId}>{this.props.userId}</Text>
        <Text style={styles.callState}>{this.props.callState}</Text>

        <View style={styles.callOptionContainer}>
          <TouchableOpacity onPress={this.props.muteButtonHandler}>
            {this.renderMuteImage()}
          </TouchableOpacity>

          <TouchableOpacity onPress={this.props.enableVideoButtonHandler}>
            {this.renderVideoImage()}
          </TouchableOpacity>

          <TouchableOpacity onPress={this.props.peakerButtonHandler}>
            {this.renderSpeakerImage()}
          </TouchableOpacity>
        </View>

        {this.props.isAnswered ? null : (
          <View style={styles.callActionContainer}>
            <TouchableOpacity onPress={this.props.rejectButtonHandler}>
              <Image
                source={require('../resource/end_call.png')}
                style={styles.button}
              />
            </TouchableOpacity>

            <TouchableOpacity
              invisible
              onPress={this.props.acceptButtonHandler}>
              <Image
                source={require('../resource/accept_call.png')}
                style={styles.button}
              />
            </TouchableOpacity>
          </View>
        )}

        {!this.props.isAnswered ? null : (
          <View style={styles.buttonEnd}>
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
          </View>
        )}
      </View>
    );
  }

  renderMuteImage = () => {
    var imgSource = this.props.isMute ? muteImg_selected : muteImg;
    return <Image style={styles.button} source={imgSource} />;
  };

  renderSpeakerImage = () => {
    var imgSource = this.props.isSpeaker ? speakerImg_selected : speakerImg;
    return <Image style={styles.button} source={imgSource} />;
  };

  renderVideoImage = () => {
    var imgSource = this.props.enableVideo ? videoEnableImg : videoDisableImg;
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
    position: 'absolute',
    height: 70,
    bottom: 80,
    width: 230,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  buttonEnd: {
    position: 'absolute',
    height: 70,
    bottom: 80,
    width: 230,
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
    top: 50,
    right: 30,
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
