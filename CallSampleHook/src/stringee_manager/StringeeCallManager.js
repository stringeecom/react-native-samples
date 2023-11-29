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
  didActiveAudioSection = false;

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

  onReceiveLocalTrack = (_, track) => {
    console.log('onReceiveLocalTrack', track);
    if (this.events) {
      this.events.onReceiveLocalTrack(track);
    }
  };

  onReceiveRemoteTrack = (_, track) => {
    console.log('onReceiveRemoteTrack', track);
    if (this.events) {
      this.events.onReceiveRemoteTrack(track);
    }
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
    this.call
      .makeCall()
      .then(() => {
        this.call.setSpeakerphoneOn(isVideoCall).then().catch(console.log);
      })
      .catch(console.log);
    this.setListenerForCall1();
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
    this.call
      .makeCall()
      .then(() => {
        this.call.setSpeakerphoneOn(isVideoCall).then().catch(console.log);
      })
      .catch(console.log);
    this.setListenerForCall2();
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
      this.call.clean();
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
    call
      .initAnswer()
      .then(() => {
        if (this.events) {
          this.events.onChangeSignalingState(SignalingState.ringing);
          if (isIos) {
            this.iOSAnswerCallTrigger();
          }
        }
      })
      .catch(console.log);
    this.call = call;
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
  initAnswer() {
    if (this.call) {
      this.call.initAnswer().then().catch(console.log);
    }
  }

  /**
   * set mute micro
   * @param {boolean} isMute
   * @param { StringeeCallBackEvent } callback function completeion
   */
  mute(isMute) {
    if (this.call) {
      this.call
        .mute(isMute)
        .then(() => {})
        .catch(console.log);
      if (this.callKeeps) {
        RNCallKeep.toggleAudioRouteSpeaker(this.callKeeps.uuid, isMute);
      }
    }
  }
  /**
   *
   * @param {StringeeCallBackEvent} callback
   */
  switchCamera() {
    if (this.call) {
      this.call
        .switchCamera()
        .then(() => {})
        .catch(console.log);
    }
  }

  /**
   *
   * @param {StringeeCallEvents} events call event
   */
  setListenerForCall1() {
    if (this.call) {
      this.call.setListener(this.callEvents);
    }
  }
  setListenerForCall2() {
    if (this.call) {
      this.call.setListener({
        ...this.callEvents,
        onReceiveLocalTrack: this.onReceiveLocalTrack,
        onReceiveRemoteTrack: this.onReceiveRemoteTrack,
      });
    }
  }
  /**
   *
   * @param {boolean} isEnable Camera is on or off
   * @param {StringeeCallBackEvent} callback stringee callback event
   */
  enableVideo(isEnable) {
    if (this.call) {
      this.call
        .enableVideo(isEnable)
        .then(() => {})
        .catch(console.log);
    }
  }
  /**
   *
   * @param {boolean} isOn Speaker is on or off
   * @param {StringeeCallBackEvent} callback stringee callback event
   */
  enableSpeaker(isOn) {
    if (this.call) {
      this.call
        .setSpeakerphoneOn(isOn)
        .then(() => {})
        .catch(console.log);
      if (this.callKeeps) {
        RNCallKeep.toggleAudioRouteSpeaker(this.callKeeps.uuid, isOn);
      }
    }
  }
  /**
   * answer the call
   * @param {StringeeCallBackEvent} callback stringee callback event
   */
  answer(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.call && !isIos) {
        this.call.answer().then(() => {
          InCallManager.stopRingtone();
          this.call
            .setSpeakerphoneOn(this.call.isVideoCall)
            .then(() => {})
            .catch(console.log);
          resolve();
        });
      } else if (this.callKeeps) {
        // đồng bộ trả lời cuộc gọi với CallKeep
        RNCallKeep.answerIncomingCall(this.callKeeps.uuid);
      }
      this.signalingState = SignalingState.answered;
    });
  }
  /**
   * hang up the call
   * @param {StringeeCallBackEvent} callback stringee callback event
   */
  hangup() {
    if (this.callKeeps) {
      RNCallKeep.endCall(this.callKeeps.uuid);
      return;
    }
    if (this.call) {
      this.call
        .hangup()
        .then(() => {})
        .catch(console.log);
    }
  }
  /**
   * reject the call
   * @param {StringeeCallBackEvent} callback stringee callback event
   */
  rejectCall() {
    if (this.callKeeps) {
      RNCallKeep.endCall(this.callKeeps.uuid);
      return;
    }
    if (this.call) {
      this.call
        .reject()
        .then(() => {})
        .catch(console.log);
    }
  }

  /**
   *
   * @param {object} data data from call keep
   */

  displayCallKeepIfNeed(data) {
    this.callKeeps = data;
    // Kiểm tra cuộc gọi đã được hiển thị phía native hay chưa
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
        // Nguời dùng từ chối cuộc gọi trước khi client nhận được event incomingCall
        if (this.callkeepRejected.includes(data.uuid)) {
          this.call
            .reject()
            .then(() => {})
            .catch(console.log);
        }
      }
    });
  }

  iOSAnswerCallTrigger() {
    /*
     Xử lý đồng bộ cuộc gọi với native ios. Để đảm bảo cuộc gọi được trả lời cần đảm bảo:
      + Event active audio section đã được gọi
      + Nhận được call từ StringeeServer
      + Hàm call.initAnswer được gọi
      + Người dùng trả lời cuộc gọi.
    */
    if (!this.didActiveAudioSection) {
      console.log('Chưa active audio section');
    }
    if (this.call == null) {
      console.log('Chưa nhận được call từ StringeeServer');
    }

    if (this.callKeeps && this.callkeepAnswered.includes(this.callKeeps.uuid)) {
      this.call.answer().then(this.didAnswer).catch(console.log);
    } else {
      console.log('Người dùng chưa trả lời cuộc gọi');
    }
  }

  callKeepEndCall(uuid) {
    /*
      Trong trường hợp người dùng nhấn endcall từ phía callkeep nhưng sdk chưa ghi nhận call
      push vào mảng callkeepRejected để xử lý sau.
    */
    if (this.callKeeps && uuid === this.callKeeps.uuid && this.call) {
      if (
        this.signalingState === SignalingState.ringing ||
        this.signalingState === SignalingState.calling
      ) {
        this.call
          .reject()
          .then(() => {})
          .catch(console.log);
      } else {
        this.call
          .hangup()
          .then(() => {})
          .catch(console.log);
      }
    } else {
      this.callkeepRejected.push(uuid);
    }
  }
}
export default StringeeCallManager;
