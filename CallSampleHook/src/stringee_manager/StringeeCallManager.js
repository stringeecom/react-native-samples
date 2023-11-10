import {
  SignalingState,
  StringeeCall,
  StringeeCall2,
} from 'stringee-react-native-v2';
import RNCallKeep from 'react-native-callkeep';
import StringeeClientManager from './StringeeClientManager';
import {
  ANSWER_ACTION_ID,
  CHANNEL_DESCRIPTION,
  CHANNEL_ID,
  CHANNEL_NAME,
  isIos,
  NOTIFICATION_ID,
  OPEN_APP_ACTION_ID,
  OPEN_APP_IN_FULL_SCREEN_MODE_ACTION_ID,
  REJECT_ACTION_ID,
} from '../const';
import InCallManager from 'react-native-incall-manager';
import {AppState} from 'react-native';
import notifee, {
  AndroidCategory,
  AndroidImportance,
} from '@notifee/react-native';
import {name} from '../../app.json';

const CallType = {
  in: 'CALL_IN',
  out: 'CALL_OUT',
};

/**
 * call manager object.
 * @class StringeeCallManager
 * @property {StringeeCallManager} instance instants object.
 * @property {StringeeCall | StringeeCall2 | undefined} call current call handle
 * @property {'CALL_IN' | 'CALLOUT'} callType type of call
 * @property {object | undefined} callkeep The call from push
 * @callback didAnswer
 */
class StringeeCallManager {
  static instance = new StringeeCallManager();
  call;
  callType;
  callKeeps;
  didAnswer;
  callkeepAnswered = [];
  callkeepRejected = [];
  signalingState;
  events;

  onChangeSignalingState = (_, signalingState, __, ___, ____) => {
    console.log('onChangeSignalingState', signalingState);
    this.signalingState = signalingState;
    if (
      signalingState === SignalingState.ended ||
      signalingState === SignalingState.answered
    ) {
      if (!isIos) {
        InCallManager.stopRingtone();
      }
    }
    if (this.events) {
      this.events.onChangeSignalingState(signalingState);
    }
  };
  onReceiveRemoteStream = _ => {
    console.log('onReceiveRemoteStream');
    if (this.events) {
      this.events.onReceiveRemoteStream();
    }
  };
  onReceiveLocalStream = _ => {
    console.log('onReceiveLocalStream');
    if (this.events) {
      this.events.onReceiveLocalStream();
    }
  };
  onChangeMediaState = (_, mediaState, __) => {
    console.log('onChangeMediaState', mediaState);
    if (this.events) {
      this.events.onChangeMediaState(_, mediaState, __);
    }
  };
  onHandleOnAnotherDevice = (_, signalingState, __) => {
    console.log('onHandleOnAnotherDevice');
    if (this.events) {
      this.events.onHandleOnAnotherDevice(signalingState);
    }
  };

  onAudioDeviceChange = (_, selectedAudioDevice, availableAudioDevices) => {
    console.log(
      'onHandleOnAudioDeviceChange',
      selectedAudioDevice,
      availableAudioDevices,
    );
  };

  callEvents = {
    onChangeSignalingState: this.onChangeSignalingState,
    onReceiveRemoteStream: this.onReceiveRemoteStream,
    onReceiveLocalStream: this.onReceiveLocalStream,
    onChangeMediaState: this.onChangeMediaState,
    onHandleOnAnotherDevice: this.onHandleOnAnotherDevice,
    onAudioDeviceChange: this.onAudioDeviceChange,
  };

  constructor() {}
  /**
   * create a call
   * @function initializeCall
   * @param {string} to To user_id or phone_number
   * @param {boolean} isVideoCall The call is video call or not
   */
  makeCall(to, isVideoCall) {
    this.call = new StringeeCall({
      stringeeClient: StringeeClientManager.instance.client,
      from: StringeeClientManager.instance.client.userId,
      to: to,
    });
    this.call.isVideoCall = isVideoCall;
    this.callType = CallType.out;
    this.call.registerEvents(this.callEvents);
    this.call.makeCall((status, code, message) => {
      if (status) {
        this.call.setSpeakerphoneOn(this.call.isVideoCall, (_, __, ___) => {});
      }
      console.log('makeCall', status, code, message);
    });
  }
  /**
   * create a call2
   * @function initializeCall2
   * @param {string} to To user_id or phone_number
   * @param {boolean} isVideoCall The call is video call or not
   */
  makeCall2(to, isVideoCall) {
    console.log('makeCall2');
    this.call = new StringeeCall2({
      stringeeClient: StringeeClientManager.instance.client,
      from: StringeeClientManager.instance.client.userId,
      to: to,
    });
    this.call.isVideoCall = isVideoCall;
    this.callType = CallType.out;
    this.call.registerEvents(this.callEvents);

    this.call.makeCall((status, code, message) => {
      if (status) {
        this.call.setSpeakerphoneOn(this.call.isVideoCall, (_, __, ___) => {});
      }
      console.log('makeCall2', status, code, message);
    });
  }

  /**
   * the call finish, reset manager
   * @function endSectionCall
   */
  endSectionCall() {
    if (!isIos) {
      InCallManager.stopRingtone();
    }
    if (this.call) {
      this.call.unregisterEvents();
      this.events = null;
      this.callKeeps = null;
      this.call = null;
      this.callkeepAnswered = [];
      this.callkeepRejected = [];
    }
  }
  /**
   * handle incoming call from stringee server
   * @funcion handleIncomingCall
   * @param {StringeeCall | undefined} call The call from onIncomingCall
   */
  handleIncomingCall(call) {
    console.log('handleIncomingCall', call.callId);
    if (!isIos) {
      InCallManager.startRingtone('_BUNDLE_');
      if (AppState.currentState === 'background') {
        this.showIncomingCallNotification(call.fromAlias).then(r =>
          console.log(r),
        );
      }
    }
    this.signalingState = SignalingState.calling;
    call.initAnswer((status, code, message) => {
      console.log('initAnswer', status, code, message);
    });
    this.call = call;
    if (this.events) {
      this.call.registerEvents(this.callEvents);
    }
    this.callType = CallType.out;
    // generate uuid and display callkeep
    this.call
      .generateUUID()
      .then(uuid => {
        this.displayCallKeepIfNeed({
          uuid: uuid,
          callId: call.callId,
          callName: call.fromAlias,
        });
      })
      .catch(console.log);
  }
  async showIncomingCallNotification(from: string) {
    const channelId = await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      description: CHANNEL_DESCRIPTION,
      vibration: true,
      importance: AndroidImportance.HIGH,
    });
    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: 'Incoming Call',
      body: 'Call from ' + from,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.CALL,
        autoCancel: false,
        ongoing: true,
        pressAction: {
          id: OPEN_APP_ACTION_ID,
          launchActivity: 'default',
        },
        actions: [
          {
            title: 'Answer',
            pressAction: {
              id: ANSWER_ACTION_ID,
              launchActivity: 'default',
            },
          },
          {
            title: 'Reject',
            pressAction: {
              id: REJECT_ACTION_ID,
            },
          },
        ],
        fullScreenAction: {
          id: OPEN_APP_IN_FULL_SCREEN_MODE_ACTION_ID,
          launchActivity: 'default',
        },
      },
    });
  }
  /**
   * init answer the call
   * @param { StringeeCallBackEvent } callback function completeion
   */
  initAnswer(callback) {
    if (this.call) {
      this.call.initAnswer(callback);
    }
  }

  /**
   * set mute micro
   * @param {boolean} isMute
   * @param { StringeeCallBackEvent } callback function completeion
   */
  mute(isMute, callback) {
    if (this.call) {
      this.call.mute(isMute, callback);
      if (isIos) {
        RNCallKeep.toggleAudioRouteSpeaker(this.callKeeps.uuid, isMute);
      }
    }
  }
  /**
   *
   * @param {StringeeCallBackEvent} callback
   */
  switchCamera(callback) {
    if (this.call) {
      this.call.switchCamera(callback);
    }
  }

  /**
   *
   * @param {StringeeCallEvents} events call event
   */
  registerEvent(events) {
    this.events = events;
    if (this.call) {
      this.call.registerEvents(this.callEvents);
    }
  }
  /**
   *
   * @param {boolean} isEnable Camera is on or off
   * @param {StringeeCallBackEvent} callback stringee callback event
   */
  enableVideo(isEnable, callback) {
    if (this.call) {
      this.call.enableVideo(isEnable, callback);
    }
  }
  /**
   *
   * @param {boolean} isOn Speaker is on or off
   * @param {StringeeCallBackEvent} callback stringee callback event
   */
  enableSpeaker(isOn, callback) {
    if (this.call) {
      this.call.setSpeakerphoneOn(isOn, callback);
      if (isIos) {
        this.callKeeps.forEach(item => {
          if (item.callId === this.call.callId) {
            RNCallKeep.toggleAudioRouteSpeaker(item.uuid, isOn);
          }
        });
      }
    }
  }
  /**
   * answer the call
   * @param {StringeeCallBackEvent} callback stringee callback event
   */
  answer(callback) {
    if (this.call && !isIos) {
      this.call.answer((status, code, message) => {
        if (!isIos) {
          InCallManager.stopRingtone();
        }
        if (status) {
          this.call.setSpeakerphoneOn(
            this.call.isVideoCall,
            (_, __, ___) => {},
          );
        }
        callback(status, code, message);
      });
    } else if (this.callKeeps) {
      RNCallKeep.answerIncomingCall(this.callKeeps.uuid);
    }
    this.signalingState = SignalingState.answered;
  }
  /**
   * hang up the call
   * @param {StringeeCallBackEvent} callback stringee callback event
   */
  hangup(callback) {
    if (isIos && this.callKeeps) {
      RNCallKeep.endCall(this.callKeeps.uuid);
      return;
    }
    if (this.call) {
      this.call.hangup(callback);
    }
  }
  /**
   * reject the call
   * @param {StringeeCallBackEvent} callback stringee callback event
   */
  rejectCall(callback) {
    if (isIos && this.callKeeps) {
      RNCallKeep.endCall(this.callKeeps.uuid);
      return;
    }
    if (this.call) {
      this.call.reject(callback);
    }
  }

  /**
   *
   * @param {object} data data from call keep
   */

  displayCallKeepIfNeed(data) {
    this.callKeeps = data;
    console.log(data);
    RNCallKeep.getCalls().then(items => {
      if (
        items.find(item => {
          return item.callUUID === data.uuid;
        }) == null
      ) {
        RNCallKeep.displayIncomingCall(
          data.uuid,
          name,
          data.callName,
          'generic',
          false,
        );
      }
      if (this.signalingState === SignalingState.ringing) {
        // Người dùng trả lời cuộc gọi trước khi client nhận được event incomingCall
        if (this.callkeepAnswered.find(item => item === data.uuid)) {
          this.call.answer();
          this.didAnswer();
        }
        // Nguời dùng từ chối cuộc gọi trước khi client nhận được event incomingCall
        if (this.callkeepRejected.find(item => item === data.uuid)) {
          this.call.reject();
        }
      }
    });
  }

  callkeepActiveAudio() {
    if (this.callKeeps != null) {
      if (this.callkeepAnswered.find(item => item === this.callKeeps.uuid)) {
        this.call.answer();
        this.didAnswer();
      }
    }
  }

  callKeepEndCall(uuid) {
    console.log('end calluuid', uuid, this.signalingState);
    if (this.callKeeps && uuid === this.callKeeps.uuid && this.call) {
      if (
        this.signalingState === SignalingState.ringing ||
        this.signalingState === SignalingState.calling
      ) {
        console.log('reject');
        this.call.reject((status, code, message) => {
          console.log('reject', status, code, message);
        });
      } else {
        this.call.hangup((status, code, message) => {
          console.log('hangup', status, code, message);
        });
      }
    }
  }
}
export default StringeeCallManager;
