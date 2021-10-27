import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Text,
  Dimensions,
  Platform,
} from 'react-native';
import {Icon} from 'react-native-elements';
import StringeeVideoTrackOption from 'stringee-react-native/src/helpers/StringeeVideoTrackOption';
import {stringeeVideoDimensions} from 'stringee-react-native/src/helpers/StringeeHelper';
import StringeeVideoView from 'stringee-react-native/src/StringeeVideoView';
import notifee, {AndroidColor} from '@notifee/react-native';
import {StringeeRoom, StringeeVideo} from 'stringee-react-native';

export default class RoomScreen extends Component {
  stringeeVideo: StringeeVideo;
  stringeeRoom: StringeeRoom;

  constructor(props) {
    super(props);
    this.state = {
      clientId: props.route.params.clientId,
      roomToken: props.route.params.roomToken,
      isMute: false,
      isVideoEnable: true,
      isSharing: false,
      hasLocalTrack: false,
      localTrack: null,
      localShareTrack: null,
      listUser: [],
      listVideoTrack: [],
    };

    this.stringeeVideo = new StringeeVideo(this.state.clientId);
    this.roomEvents = {
      didJoinRoom: this.handleJoinRoom,
      didLeaveRoom: this.handleLeaveRoom,
      didAddVideoTrack: this.handleAddVideoTrack,
      didRemoveVideoTrack: this.handleRemoveVideoTrack,
      didReceiveRoomMessage: this.handleReceiveRoomMessage,
    };
  }

  componentDidMount(): void {
    this.stringeeVideo.connect(
      this.state.roomToken,
      (status, code, message, data) => {
        if (status) {
          this.setState({
            listUser: data.users,
          });
          this.stringeeRoom = data.room;
          this.stringeeRoom.registerRoomEven(this.roomEvents);
          this.publishLocalTrack();

          if (data.videoTracks.length > 0) {
            data.videoTracks.forEach(videoTrack => {
              this.stringeeRoom.subscribe(
                videoTrack,
                new StringeeVideoTrackOption(
                  videoTrack.audioEnable,
                  videoTrack.videoEnable,
                  videoTrack.isScreenCapture,
                  stringeeVideoDimensions.dimensions_1080,
                ),
                (status, code, message) => {
                  if (status) {
                    var newTrackList = [
                      ...this.state.listVideoTrack,
                      videoTrack,
                    ];
                    this.setState({
                      listVideoTrack: newTrackList,
                    });
                  }
                },
              );
            });
          }
        }
      },
    );
  }

  componentWillUnmount(): void {
    this.stringeeRoom.close();
  }

  publishLocalTrack() {
    const trackOptions = new StringeeVideoTrackOption(
      true,
      true,
      false,
      stringeeVideoDimensions.dimensions_1080,
    );
    this.stringeeVideo.createLocalVideoTrack(
      trackOptions,
      (status, code, message, data) => {
        if (status) {
          this.stringeeRoom.publish(data, (status, code, message, data) => {
            if (status) {
              this.setState({
                localTrack: data,
                hasLocalTrack: true,
              });
            }
          });
        }
      },
    );
  }

  handleJoinRoom = user => {
    console.log('handleJoinRoom - ' + JSON.stringify(user));
    this.setState({
      listUser: [...this.state.listUser, user],
    });
  };

  handleLeaveRoom = user => {
    console.log('handleLeaveRoom - ' + JSON.stringify(user));
    const newUserList = this.state.listUser.filter(
      value => value.userId !== user.userId,
    );
    this.setState({
      listUser: newUserList,
    });
  };

  handleAddVideoTrack = videoTrack => {
    console.log('handleAddVideoTrack - ' + JSON.stringify(videoTrack));
    this.stringeeRoom.subscribe(
      videoTrack,
      new StringeeVideoTrackOption(
        videoTrack.audioEnable,
        videoTrack.videoEnable,
        videoTrack.isScreenCapture,
        stringeeVideoDimensions.dimensions_1080,
      ),
      (status, code, message) => {
        if (status) {
          const newTrackList = [...this.state.listVideoTrack, videoTrack];
          this.setState({
            listVideoTrack: newTrackList,
          });
        }
      },
    );
  };

  handleRemoveVideoTrack = videoTrack => {
    console.log('handleRemoveVideoTrack - ' + JSON.stringify(videoTrack));
    const newTrackList = this.state.listVideoTrack.filter(
      value => value.trackId !== videoTrack.trackId,
    );
    this.setState({
      listVideoTrack: newTrackList,
    });
  };

  handleReceiveRoomMessage = ({msg, from}) => {
    console.log(
      'handleReceiveRoomMessage - msg - ' +
        msg +
        ' - from - ' +
        JSON.stringify(from),
    );
  };

  switchPress = () => {
    this.state.localTrack.switchCamera((status, code, message) => {
      console.log('switch - ' + message);
    });
  };

  mutePress = () => {
    this.state.localTrack.mute(!this.state.isMute, (status, code, message) => {
      if (status) {
        this.setState({
          isMute: !this.state.isMute,
        });
      }
    });
  };

  videoPress = () => {
    this.state.localTrack.enableVideo(
      !this.state.isVideoEnable,
      (status, code, message) => {
        if (status) {
          this.setState({
            isVideoEnable: !this.state.isVideoEnable,
          });
        }
      },
    );
  };

  sharePress = () => {
    if (this.state.isSharing) {
      this.stringeeRoom.unpublish(
        this.state.localShareTrack,
        (status, code, message) => {
          if (status) {
            this.state.localShareTrack.close((status, code, message) => {
              if (status) {
                notifee.stopForegroundService();
              }
            });
          }
        },
      );
    } else {
      this.displayForegroundService();
      this.stringeeVideo.createCaptureScreenTrack(
        (status, code, message, data) => {
          console.log('createCaptureScreenTrack - ' + message);
          if (status) {
            this.stringeeRoom.publish(
              data,
              (status, code, message, videoTrack) => {
                if (status) {
                  var newTrackList = [...this.state.listVideoTrack, videoTrack];
                  this.setState({
                    localShareTrack: videoTrack,
                    listVideoTrack: newTrackList,
                    isSharing: !this.state.isSharing,
                  });
                }
              },
            );
          }
        },
      );
    }
  };

  async displayForegroundService() {
    const notificationId = '11111'; // YOUR_NOTIFICATION_ID
    const channelId = await notifee.createChannel({
      id: 'YOUR_CHANNEL_ID',
      name: 'ChannelName',
      vibration: true,
    });

    await notifee.displayNotification({
      id: notificationId,
      title: 'Screen capture service',
      body: 'Screen capture service',
      android: {
        channelId,
        asForegroundService: true,
      },
    });
  }

  endPress = () => {
    // unsubcrise other video track
    if (this.state.listVideoTrack.length > 0) {
      this.state.listVideoTrack.forEach((track, index) => {
        if (!track.isLocal) {
          this.stringeeRoom.unsubscribe(track, (status, code, message) => {});
        }
      });
    }

    if (this.state.isSharing) {
      this.stringeeRoom.unpublish(
        this.state.localShareTrack,
        (status, code, message) => {
          if (status) {
            this.state.localShareTrack.close((status, code, message) => {
              if (status) {
                notifee.stopForegroundService();
              }
            });
          }
        },
      );
    }

    this.stringeeRoom.unpublish(
      this.state.localTrack,
      (status, code, message) => {
        if (status) {
          this.state.localTrack.close((status, code, message) => {
            if (status) {
              this.stringeeRoom.leave(false, (status, code, message) => {
                if (status) {
                  this.props.navigation.goBack();
                }
              });
            }
          });
        }
      },
    );
  };

  render(): React.ReactNode {
    const CircleBtn = ({color, iconName, iconColor, onPress}) => (
      <TouchableOpacity
        style={{
          width: 70,
          height: 70,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 100,
          backgroundColor: color,
        }}
        onPress={onPress}>
        <Icon name={iconName} type="material" color={iconColor} size={30} />
      </TouchableOpacity>
    );

    const BorderBtn = ({color, iconName, iconColor, onPress}) => (
      <TouchableOpacity
        style={{
          width: 75,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 15,
          backgroundColor: color,
        }}
        onPress={onPress}>
        <Icon name={iconName} type="material" color={iconColor} size={25} />
      </TouchableOpacity>
    );

    const renderItem = item => {
      return (
        <StringeeVideoView
          style={this.styles.trackView}
          trackId={item.item.trackId}
          overlay={true}
        />
      );
    };

    return (
      <View style={this.styles.container}>
        {this.state.hasLocalTrack && (
          <StringeeVideoView
            style={this.styles.localView}
            overlay={false}
            trackId={this.state.localTrack.trackId}
          />
        )}

        <View style={this.styles.listTrackView}>
          {this.state.listVideoTrack.length > 0 ? (
            <FlatList
              horizontal
              data={this.state.listVideoTrack}
              renderItem={renderItem}
            />
          ) : null}
        </View>

        <View style={this.styles.bottomContainer}>
          <CircleBtn
            color="white"
            iconName="switch-camera"
            iconColor="black"
            onPress={this.switchPress}
          />

          <CircleBtn
            color={this.state.isMute ? '#FFFFFF8A' : 'white'}
            iconName={this.state.isMute ? 'mic-off' : 'mic'}
            iconColor={this.state.isMute ? 'white' : 'black'}
            onPress={this.mutePress}
          />

          <CircleBtn
            color={!this.state.isVideoEnable ? '#FFFFFF8A' : 'white'}
            iconName={!this.state.isVideoEnable ? 'videocam-off' : 'videocam'}
            iconColor={!this.state.isVideoEnable ? 'white' : 'black'}
            onPress={this.videoPress}
          />

          {Platform.OS === 'android' && (
            <CircleBtn
              color={!this.state.isSharing ? '#FFFFFF8A' : 'white'}
              iconName={
                !this.state.isSharing ? 'stop-screen-share' : 'screen-share'
              }
              iconColor={!this.state.isSharing ? 'white' : 'black'}
              onPress={this.sharePress}
            />
          )}
        </View>

        <View style={this.styles.endCallView}>
          <BorderBtn
            color="#ff5454"
            iconName="call-end"
            iconColor="white"
            onPress={this.endPress}
          />
        </View>
      </View>
    );
  }

  styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: '#00A6AD',
      position: 'relative',
    },

    bottomContainer: {
      height: 70,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      position: 'absolute',
      bottom: 20,
      zIndex: 1,
    },

    endCallView: {
      top: 20,
      right: 20,
      position: 'absolute',
      zIndex: 1,
    },

    localView: {
      backgroundColor: 'black',
      position: 'absolute',
      top: 0,
      left: 0,
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
      zIndex: 0,
    },

    listTrackView: {
      flexDirection: 'row',
      position: 'absolute',
      bottom: 150,
      zIndex: 1,
    },

    trackView: {
      zIndex: 2,
      height: 150,
      width: 100,
    },
  });
}
