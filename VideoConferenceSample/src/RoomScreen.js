import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import {Icon} from 'react-native-elements';
import notifee from '@notifee/react-native';
import {
  ScalingType,
  StringeeVideo,
  StringeeVideoDimensions,
  StringeeVideoRoom,
  StringeeVideoTrackInfo,
  StringeeVideoTrackOption,
  StringeeVideoView,
} from 'stringee-react-native';

export default class RoomScreen extends Component {
  stringeeVideo: StringeeVideo;
  stringeeVideoRoom: StringeeVideoRoom;

  constructor(props) {
    super(props);
    this.state = {
      clientId: props.route.params.clientId,
      roomToken: props.route.params.roomToken,
      isMute: false,
      isVideoEnable: true,
      localTrack: null,
      hasLocalTrackView: false,
      isSharing: false,
      localShareTrack: null,
      listRemoteTrack: [],
      listRemoteTrackReady: [],
    };

    this.stringeeVideo = new StringeeVideo(this.state.clientId);
    this.roomEvents = {
      didJoinRoom: this.handleJoinRoom,
      didLeaveRoom: this.handleLeaveRoom,
      didAddVideoTrack: this.handleAddVideoTrack,
      didRemoveVideoTrack: this.handleRemoveVideoTrack,
      didReceiveRoomMessage: this.handleReceiveRoomMessage,
      trackReadyToPlay: this.handleTrackReadyToPlay,
    };
  }

  componentDidMount(): void {
    this.stringeeVideo.joinRoom(
      this.state.roomToken,
      (status, code, message, data) => {
        if (status) {
          this.setState({
            listUser: data.users,
          });
          this.stringeeVideoRoom = data.room;

          this.stringeeVideoRoom.registerRoomEvent(this.roomEvents);
          this.publishLocalTrack();

          if (data.videoTrackInfos.length > 0) {
            data.videoTrackInfos.forEach(videoTrackInfo => {
              this.subscribeTrack(videoTrackInfo);
            });
          }
        } else {
          this.props.navigation.goBack();
        }
      },
    );
  }

  subscribeTrack(videoTrackInfo: StringeeVideoTrackInfo) {
    this.stringeeVideoRoom.subscribe(
      videoTrackInfo,
      new StringeeVideoTrackOption(
        videoTrackInfo.audioEnable,
        videoTrackInfo.videoEnable,
        videoTrackInfo.isScreenCapture,
        StringeeVideoDimensions.dimensions_1080,
      ),
      (status, code, message, videoTrack) => {
        if (status) {
          // this.state.listVideoTrack.
          let newTrackList = [...this.state.listRemoteTrack, videoTrack];
          this.setState({
            listRemoteTrack: newTrackList,
          });
        }
      },
    );
  }

  componentWillUnmount(): void {
    this.stringeeVideoRoom.close();
  }

  publishLocalTrack() {
    const trackOptions = new StringeeVideoTrackOption(
      true,
      true,
      false,
      StringeeVideoDimensions.dimensions_1080,
    );
    this.stringeeVideo.createLocalVideoTrack(
      trackOptions,
      (status, code, message, data) => {
        console.log('createLocalVideoTrack - ' + message);
        if (status) {
          this.stringeeVideoRoom.publish(
            data,
            (status1, code1, message1, localTrack) => {
              console.log('publish - ' + message);
              if (status1) {
                this.setState({
                  localTrack: localTrack,
                });
              }
            },
          );
        }
      },
    );
  }

  handleJoinRoom = user => {
    console.log('handleJoinRoom - ' + JSON.stringify(user));
  };

  handleLeaveRoom = user => {
    console.log('handleLeaveRoom - ' + JSON.stringify(user));
  };

  handleAddVideoTrack = videoTrackInfo => {
    console.log('handleAddVideoTrack - ' + JSON.stringify(videoTrackInfo));
    this.subscribeTrack(videoTrackInfo);
  };

  handleRemoveVideoTrack = videoTrackInfo => {
    console.log('handleRemoveVideoTrack - ' + JSON.stringify(videoTrackInfo));
    const newTrackList = this.state.listRemoteTrack.filter(
      value => value.getTrackId() !== videoTrackInfo.trackId,
    );

    const newTrackReadyList = this.state.listRemoteTrackReady.filter(
      value => value.getTrackId() !== videoTrackInfo.trackId,
    );
    this.setState({
      listRemoteTrack: newTrackList,
      listRemoteTrackReady: newTrackReadyList,
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

  handleTrackReadyToPlay = videoTrack => {
    console.log('handleTrackReadyToPlay - ' + JSON.stringify(videoTrack));
    if (videoTrack.isLocal) {
      if (videoTrack.isScreenCapture) {
        let newTrackReadyList = [
          ...this.state.listRemoteTrackReady,
          videoTrack,
        ];
        this.setState({
          listRemoteTrackReady: newTrackReadyList,
        });
      } else {
        this.setState({
          hasLocalTrackView: true,
        });
      }
    } else {
      let newTrackReadyList = [...this.state.listRemoteTrackReady, videoTrack];
      this.setState({
        listRemoteTrackReady: newTrackReadyList,
      });
    }
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
      this.stringeeVideoRoom.unpublish(
        this.state.localShareTrack,
        (status, code, message) => {
          if (status) {
            notifee.stopForegroundService();
            this.setState({
              isSharing: !this.state.isSharing,
            });
            const newTrackList = this.state.listRemoteTrack.filter(
              value =>
                value.getTrackId() !== this.state.localShareTrack.localId,
            );

            const newTrackReadyList = this.state.listRemoteTrackReady.filter(
              value =>
                value.getTrackId() !== this.state.localShareTrack.localId,
            );
            this.setState({
              listRemoteTrack: newTrackList,
              listRemoteTrackReady: newTrackReadyList,
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
            this.stringeeVideoRoom.publish(
              data,
              (status, code, message, videoTrack) => {
                if (status) {
                  const newTrackList = [
                    ...this.state.listRemoteTrack,
                    videoTrack,
                  ];
                  this.setState({
                    localShareTrack: videoTrack,
                    listRemoteTrack: newTrackList,
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
    this.stringeeVideoRoom.leave(false, (status, code, message) => {
      console.log('leave ' + message);
      if (status) {
        if (this.state.isSharing) {
          notifee.stopForegroundService();
        }
        this.props.navigation.goBack();
      }
    });
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
          trackId={item.item.getTrackId()}
          scalingType={ScalingType.FIT}
          overlay={true}
        />
      );
    };

    return (
      <SafeAreaView style={this.styles.container}>
        {this.state.hasLocalTrackView ? (
          <StringeeVideoView
            style={this.styles.localView}
            overlay={false}
            scalingType={ScalingType.FIT}
            trackId={this.state.localTrack.getTrackId()}
          />
        ) : null}

        <View style={this.styles.listTrackView}>
          {this.state.listRemoteTrackReady.length > 0 ? (
            <FlatList
              horizontal
              data={this.state.listRemoteTrackReady}
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
      </SafeAreaView>
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
