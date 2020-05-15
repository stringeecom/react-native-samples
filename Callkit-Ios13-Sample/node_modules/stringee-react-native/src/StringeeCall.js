import { Component } from "react";
import PropTypes from "prop-types";
import { NativeModules, NativeEventEmitter, Platform } from "react-native";
import { callEvents } from "./helpers/StringeeHelper";
import { each } from "underscore";

const RNStringeeCall = NativeModules.RNStringeeCall;

export default class extends Component {
  static propTypes = {
    eventHandlers: PropTypes.object
  };

  constructor(props) {
    super(props);
    this._events = [];
    this._subscriptions = [];
    this._eventEmitter = new NativeEventEmitter(RNStringeeCall);
  }

  componentWillMount() {
    this.sanitizeCallEvents(this.props.eventHandlers);
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

    this._events.forEach(e => RNStringeeCall.removeNativeEvent(e));
    this._events = [];
  }

  sanitizeCallEvents(events) {
    if (typeof events !== "object") {
      return;
    }
    const platform = Platform.OS;

    each(events, (handler, type) => {
      const eventName = callEvents[platform][type];
      if (eventName !== undefined) {
        this._subscriptions.push(
          this._eventEmitter.addListener(eventName, data => {
            handler(data);
          })
        );

        this._events.push(eventName);
        RNStringeeCall.setNativeEvent(eventName);
      } else {
        console.log(`${type} is not a supported event`);
      }
    });
  }

  makeCall(parameters: string, callback: RNStringeeEventCallback) {
    RNStringeeCall.makeCall(parameters, callback);
  }

  initAnswer(callId: string, callback: RNStringeeEventCallback) {
    RNStringeeCall.initAnswer(callId, callback);
  }

  answer(callId: string, callback: RNStringeeEventCallback) {
    RNStringeeCall.answer(callId, callback);
  }

  hangup(callId: string, callback: RNStringeeEventCallback) {
    RNStringeeCall.hangup(callId, callback);
  }

  reject(callId: string, callback: RNStringeeEventCallback) {
    RNStringeeCall.reject(callId, callback);
  }

  sendDTMF(callId: string, dtmf: string, callback: RNStringeeEventCallback) {
    RNStringeeCall.sendDTMF(callId, dtmf, callback);
  }

  sendCallInfo(
    callId: string,
    callInfo: string,
    callback: RNStringeeEventCallback
  ) {
    RNStringeeCall.sendCallInfo(callId, callInfo, callback);
  }

  getCallStats(callId: string, callback: RNStringeeEventCallback) {
    RNStringeeCall.getCallStats(callId, callback);
  }

  switchCamera(callId: string, callback: RNStringeeEventCallback) {
    RNStringeeCall.switchCamera(callId, callback);
  }

  enableVideo(
    callId: string,
    enabled: boolean,
    callback: RNStringeeEventCallback
  ) {
    RNStringeeCall.enableVideo(callId, enabled, callback);
  }

  mute(callId: string, mute: boolean, callback: RNStringeeEventCallback) {
    RNStringeeCall.mute(callId, mute, callback);
  }

  setSpeakerphoneOn(
    callId: string,
    on: boolean,
    callback: RNStringeeEventCallback
  ) {
    RNStringeeCall.setSpeakerphoneOn(callId, on, callback);
  }
}
