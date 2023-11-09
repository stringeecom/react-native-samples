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

/**
 * call manager object.
 * @class StringeeCallManager
 * @property {StringeeCallManager} instance instants object.
 * @property {StringeeCall | StringeeCall2 | undefined} call current call handle
 * @property {'CALL_IN' | 'CALLOUT'} callType type of call
 * @property {object | undefined} callkeep The call from push
 * @callback didAns
 */
class StringeeCallManager {
  static instance = new StringeeCallManager();
  call;
  callType;
  callKeeps = [];
  didAns;
  answered = false;
  callDidAnsFromPush;
  callDidRejectFromPush;
  signalingState;
  events;
  didAnsItem;
  callEvents = {
    onChangeSignalingState: (_, signalingState, __, ___, ____) => {
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
    },
    onReceiveRemoteStream: _ => {
      if (this.events) {
        this.events.onReceiveRemoteStream();
      }
    },
    onReceiveLocalStream: _ => {
      if (this.events) {
        console.log('events' + JSON.stringify(this.events));
        this.events.onReceiveLocalStream();
      }
    },
    onChangeMediaState: (_, mediaState, __) => {
      console.log('onChangeMediaState', mediaState);
      if (this.events) {
        this.events.onChangeMediaState(_, mediaState, __);
      }
    },
    onHandleOnAnotherDevice: (_, signalingState, __) => {
      console.log('onHandleOnAnotherDevice');
      if (this.events) {
        this.events.onHandleOnAnotherDevice(signalingState);
      }
    },
  };

  constructor() {
    console.log('khoi tao StringeeCall');
  }
  /**
   * create a call
   * @function initializeCall
   * @param {string} to To user_id or phone_number
   * @param {boolean} isVideoCall The call is video call or not
   */
  initializeCall(to, isVideoCall) {
    this.call = new StringeeCall({
      stringeeClient: StringeeClientManager.instance.client,
      from: StringeeClientManager.instance.client.userId,
      to: to,
    });
    this.call.isVideoCall = isVideoCall;
    this.callType = 'CALL_OUT';
    this.call.registerEvents(this.callEvents);
  }
  /**
   * create a call2
   * @function initializeCall2
   * @param {string} to To user_id or phone_number
   * @param {boolean} isVideoCall The call is video call or not
   */
  initializeCall2(to, isVideoCall) {
    this.call = new StringeeCall2({
      stringeeClient: StringeeClientManager.instance.client,
      from: StringeeClientManager.instance.client.userId,
      to: to,
    });
    this.call.isVideoCall = isVideoCall;
    this.callType = 'CALL_OUT';
    this.call.registerEvents(this.callEvents);
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
    }
    this.didAns = null;
    this.events = null;
    this.callKeeps = [];
    this.call = null;
    this.answered = false;
    this.callDidAnsFromPush = null;
    this.callDidRejectFromPush = null;
  }
  /**
   * handle incoming call from stringee server
   * @funcion handleIncomingCall
   * @param {StringeeCall | undefined} call The call from onIncomingCall
   */
  handleIncomingCall(call) {
    console.log('handleIncomingCall', call);
    if (!isIos) {
      InCallManager.startRingtone('_BUNDLE_');
      if (AppState.currentState === 'background') {
        this.showIncomingCallNotification(call.fromAlias).then(r =>
          console.log(r),
        );
      }
    }

    call.initAnswer((status, code, message) => {
      console.log('initAnswer', status, code, message);
    });
    this.call = call;
    if (this.events) {
      this.call.registerEvents(this.callEvents);
    }
    this.callType = 'CALL_IN';
    if (isIos) {
      if (
        this.callDidAnsFromPush &&
        this.callDidAnsFromPush.callId === call.callId
      ) {
        this.answerCallKeep();
      }
      if (this.callDidRejectFromPush) {
        this.endCallKeep(this.callDidRejectFromPush);
      }
    }
    this.call
      .generateUUID()
      .then(uuid => {
        this.handleCallkeep({
          uuid: uuid,
          callId: call.callId,
          callName: call.fromAlias,
        });
      })
      .catch(console.log);
  }

  async showIncomingCallNotification(from: String) {
    const channelId = await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      description: CHANNEL_DESCRIPTION,
      vibration: true,
      importance: AndroidImportance.HIGH,
    });
    console.log('vao day ko');
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
        this.callKeeps.forEach(item => {
          if (item.callId === this.call.callId) {
            RNCallKeep.toggleAudioRouteSpeaker(item.uuid, isMute);
          }
        });
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
      if (isIos) {
        this.callKeeps.forEach(item => {
          if (item.callId === this.call.callId) {
            RNCallKeep.answerIncomingCall(item.uuid);
            this.didAnsItem = item;
          }
        });
      }
    }
  }

  /**
   * make the call
   * @param {StringeeCallBackEvent} callback stringee callback event
   */
  makeCall(callback) {
    if (this.call) {
      this.call.makeCall((status, code, message) => {
        if (status) {
          this.call.setSpeakerphoneOn(
            this.call.isVideoCall,
            (_, __, ___) => {},
          );
        }
        callback(status, code, message);
      });
    }
  }
  /**
   * hang up the call
   * @param {StringeeCallBackEvent} callback stringee callback event
   */
  hangup(callback) {
    if (this.call) {
      this.call.hangup(callback);
    }
    if (this.events) {
      this.events.onChangeSignalingState(SignalingState.ended);
    }
  }
  /**
   * reject the call
   * @param {StringeeCallBackEvent} callback stringee callback event
   */
  rejectCall(callback) {
    if (this.call) {
      this.call.reject(callback);
    }
    if (this.events) {
      this.events.onChangeSignalingState(SignalingState.ended);
    }
  }
  /**
   *
   * @param {object} data data from call keep
   */
  handleCallkeep(data) {
    if (
      this.callKeeps.find(item => {
        return item.callId === data.callId;
      }) == null
    ) {
      console.log('uuid js: ', data.uuid);
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
            data,
          );
        }
      });
      this.callKeeps.push(data);
    }
  }
  /**
   * If the manager class is handling the call check if the call is anwered from callkeep or not
   */

  handleAnswerCallKeep(uuid) {
    this.didAnsItem = this.callKeeps.find(item => {
      return item.uuid === uuid;
    });
  }

  answerCallKeep(): void {
    if (
      this.call &&
      this.call.callId === this.didAnsItem.callId &&
      this.call.callId
    ) {
      this.call.answer((status, code, message) => {
        console.log('answer', status, code, message);
        if (!isIos) {
          InCallManager.stopRingtone();
        }
        if (this.didAns && status) {
          this.didAns();
          console.log('did answerCallKeep');
          this.call.setSpeakerphoneOn(
            this.call.isVideoCall,
            (_, __, ___) => {},
          );
        }
      });
    } else {
      this.callDidAnsFromPush = this.didAnsItem;
    }
  }
  /**
   * @param {string} uuid end call uuid
   */
  endCallKeep(uuid: string): void {
    console.log('reject call keep');
    if (this.call) {
      this.callKeeps.forEach(item => {
        if (item.uuid === uuid && item.callId === this.call.callId) {
          this.call.reject();
        }
      });
    } else {
      this.callDidRejectFromPush = uuid;
    }
  }
}

export default StringeeCallManager;
