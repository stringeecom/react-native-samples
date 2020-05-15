import { Component } from "react";
import PropTypes from "prop-types";
import { NativeModules, NativeEventEmitter, Platform } from "react-native";
import { roomEvents } from "./helpers/StringeeHelper";
import { each } from "underscore";

const RNStringeeRoom = NativeModules.RNStringeeRoom;

export default class extends Component {
  static propTypes = {
    eventHandlers: PropTypes.object
  };

  constructor(props) {
    super(props);
    this._events = [];
    this._subscriptions = [];
    this._eventEmitter = new NativeEventEmitter(RNStringeeRoom);
  }

  componentWillMount() {
    this.sanitizeRoomEvents(this.props.eventHandlers);
  }

  componentWillUnmount() {
    this._unregisterEvents();
  }

  render() {
    return null;
  }

  _unregisterEvents() {
    this._subscriptions.forEach(e => e.remove());
    this._subscriptions = [];

    this._events.forEach(e => RNStringeeRoom.removeNativeEvent(e));
    this._events = [];
  }

  sanitizeRoomEvents(events) {
    if (typeof events !== "object") {
      return;
    }
    const platform = Platform.OS;

    each(events, (handler, type) => {
      const eventName = roomEvents[platform][type];
      if (eventName !== undefined) {
        this._subscriptions.push(
          this._eventEmitter.addListener(eventName, data => {
            handler(data);
          })
        );

        this._events.push(eventName);
        RNStringeeRoom.setNativeEvent(eventName);
      } else {
        console.log(`${type} is not a supported event`);
      }
    });
  }

  makeRoom(callback: RNStringeeEventCallback) {
    RNStringeeRoom.makeRoom(callback);
  }

  joinRoom(roomId: number, callback: RNStringeeEventCallback) {
    RNStringeeRoom.joinRoom(roomId, callback);
  }

  publishLocalStream(
    roomId: number,
    config: string,
    callback: RNStringeeEventCallback
  ) {
    RNStringeeRoom.publishLocalStream(roomId, config, callback);
  }

  unPublishLocalStream(
    roomId: number,
    streamId: string,
    callback: RNStringeeEventCallback
  ) {
    RNStringeeRoom.unPublishLocalStream(roomId, streamId, callback);
  }

  subscribe(
    roomId: number,
    streamId: string,
    callback: RNStringeeEventCallback
  ) {
    RNStringeeRoom.subscribe(roomId, streamId, callback);
  }

  unSubscribe(
    roomId: number,
    streamId: string,
    callback: RNStringeeEventCallback
  ) {
    RNStringeeRoom.unSubscribe(roomId, streamId, callback);
  }

  destroy(roomId: number, callback: RNStringeeEventCallback) {
    RNStringeeRoom.destroy(roomId, callback);
  }

  switchCamera() {
    RNStringeeRoom.switchCamera();
  }

  mute(isMute: boolean) {
    RNStringeeRoom.mute(isMute);
  }

  turnOnCamera(isOn: boolean, callback: RNStringeeEventCallback) {
    RNStringeeRoom.turnOnCamera(isOn, callback);
  }

  setSpeakerphoneOn(isOn: boolean) {
    RNStringeeRoom.setSpeakerphoneOn(isOn);
  }

  getStats(
    roomId: number,
    streamId: string,
    useVideoTrack: boolean,
    callback: RNStringeeEventCallback
  ) {
    RNStringeeRoom.getStats(roomId, streamId, useVideoTrack, callback);
  }
}
