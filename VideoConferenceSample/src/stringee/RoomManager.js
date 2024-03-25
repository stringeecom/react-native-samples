import {
  StringeeVideo,
  StringeeVideoRoom,
  StringeeVideoRoomListener,
  StringeeVideoTrack,
  StringeeVideoTrackOption,
} from 'stringee-react-native-v2';
import { VideoResolution } from 'stringee-react-native-v2/src/helpers/StringeeHelper';

export class RoomManager {
  static instance = new RoomManager();
  room: StringeeVideoRoom;
  localTrack: StringeeVideoTrack;
  displayTrack: Array<StringeeVideoTrack> = [];
  needUpdateDisplay: boolean;
  onLeave;
  didLeave = false;

  constructor() {
  }

  onJoinRoom = (_, __) => {
  };

  onLeaveRoom = (_, user) => {
    console.log('onLeaveRoom', user);
    if (user.userId === this.room.client.userId) {
      if (this.onLeave && !this.didLeave) {
        this.onLeave();
        this.didLeave = true;
      }
    }
  };

  onAddVideoTrack = (_, trackInfo) => {
    console.log('onAddVideoTrack: ', trackInfo.id);
    this.room
      .subscribe(
        trackInfo,
        new StringeeVideoTrackOption({
          audio: true,
          video: true,
          videoResolution: VideoResolution.hd,
        })
      )
      .catch(console.log);
  };

  onReceiptRoomMessage = (_, from, msg) => {
    console.log(from, msg);
  };

  onTrackReadyToPlay = (_, track) => {
    console.log('onTrackReadyToPlay: ', track);
    this.displayTrack.push(track);
    if (this.needUpdateDisplay) {
      this.needUpdateDisplay(this.displayTrack);
    }
  };

  onRemoveVideoTrack = (_, trackInfo) => {
    let index = this.displayTrack.findIndex(item => {
      return item.serverId === trackInfo.id;
    });
    console.log('onRemoveVideoTrack: ', index, trackInfo.id);
    if (index !== -1) {
      this.displayTrack.splice(index, 1);
      if (this.needUpdateDisplay) {
        this.needUpdateDisplay(this.displayTrack);
      }
    }
  };

  setRoom(room: StringeeVideoRoom, tracks) {
    this.displayTrack = [];
    this.room = room;
    this.localTrack = null;
    this.didLeave = false;
    if (tracks) {
      tracks.forEach(trackInfo => {
        this.room
          .subscribe(
            trackInfo,
            new StringeeVideoTrackOption(true, true, false, VideoResolution.hd)
          )
          .catch(console.log);
      });
    }
    let roomEvent = new StringeeVideoRoomListener();
    roomEvent.onJoinRoom = this.onJoinRoom;
    roomEvent.onLeaveRoom = this.onLeaveRoom;
    roomEvent.onAddVideoTrack = this.onAddVideoTrack;
    roomEvent.onReceiptRoomMessage = this.onReceiptRoomMessage;
    roomEvent.onTrackReadyToPlay = this.onTrackReadyToPlay;
    roomEvent.onRemoveVideoTrack = this.onRemoveVideoTrack;
    this.room.setListener(roomEvent);

    this.createLocalTrack().then().catch(console.log);
  }

  async createLocalTrack() {
    try {
      this.localTrack = await StringeeVideo.createLocalVideoTrack(
        this.room,
        new StringeeVideoTrackOption(true, true, false, VideoResolution.hd)
      );
      await this.room.publish(this.localTrack);
    } catch (error) {
    }
  }

  async mute(isMute) {
    await this.localTrack.mute(isMute);
  }

  async enableVideo(isOn) {
    await this.localTrack.enableVideo(isOn);
  }

  async switchCamera() {
    await this.localTrack.switchCamera();
  }

  async leave(isLeaveAll) {
    await this.room.leave(isLeaveAll);
    StringeeVideo.releaseRoom(this.room);
    if (this.onLeave && !this.didLeave) {
      this.onLeave();
      this.didLeave = true;
    }
  }
}
