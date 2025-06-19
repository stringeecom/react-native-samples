import {
  AudioDevice,
  AudioType,
  SignalingState,
  StringeeAudioListener,
  StringeeAudioManager,
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
 * Call manager object.
 * @class StringeeCallManager
 * @property {StringeeCallManager} instance instants object.
 * @property {StringeeCall | StringeeCall2 | undefined} call current call handle
 * @property {'CALL_IN' | 'CALLOUT'} callType type of call
 * @property {object | undefined} callkeep The call from push
 * @callback didAnswer callback to CallScreen when call is answered
 * @property callkeepAnswered list of the answered call from CallKeep
 * @property callkeepRejected list of the rejected call from CallKeep
 * @property signalingState the signaling state of the call
 * @property events the call manager event send to CallScreen
 * @property didActiveAudioSection the status of AudioSection in CallKeep
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
  audioListener = new StringeeAudioListener();
  initializingAudio = true;
  audioDevice: AudioDevice;
  availableAudioDevices: Array<AudioDevice> = [];

  // Invoked when the call's signaling state changes
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
      this.stopAudioManager();
    }
    if (this.events) {
      this.events.onChangeSignalingState(signalingState);
    }
  };

  // Invoked when remote stream in video call is ready to play
  onReceiveRemoteStream = _ => {
    console.log('onReceiveRemoteStream');
    if (this.events) {
      this.events.onReceiveRemoteStream();
    }
  };

  // Invoked when local stream in video call is ready to play
  onReceiveLocalStream = _ => {
    console.log('onReceiveLocalStream');
    if (this.events) {
      this.events.onReceiveLocalStream();
    }
  };

  // Invoked when the call's media state changes
  onChangeMediaState = (_, mediaState, __) => {
    console.log('onChangeMediaState', mediaState);
    if (this.events) {
      this.events.onChangeMediaState(_, mediaState, __);
    }
  };

  // Invoked when an incoming call is handle on another device
  onHandleOnAnotherDevice = (_, signalingState, __) => {
    console.log('onHandleOnAnotherDevice');
    if (this.events) {
      this.events.onHandleOnAnotherDevice(signalingState);
    }
  };

  // Invoked when the current audio device changes in android
  onAudioDeviceChange = (selectedAudioDevice, availableAudioDevices) => {
    console.log(
      'onHandleOnAudioDeviceChange',
      selectedAudioDevice,
      availableAudioDevices,
    );
    this.availableAudioDevices = availableAudioDevices;
    if (this.initializingAudio) {
      this.initializingAudio = false;
      let bluetoothIndex = -1;
      let wiredHeadsetIndex = -1;
      let speakerIndex = -1;
      let earpieceIndex = -1;
      availableAudioDevices.forEach(device => {
        if (device.audioType === AudioType.bluetooth) {
          bluetoothIndex = availableAudioDevices.indexOf(device);
        }
        if (device.audioType === AudioType.wiredHeadset) {
          wiredHeadsetIndex = availableAudioDevices.indexOf(device);
        }
        if (device.audioType === AudioType.speakerPhone) {
          speakerIndex = availableAudioDevices.indexOf(device);
        }
        if (device.audioType === AudioType.earpiece) {
          earpieceIndex = availableAudioDevices.indexOf(device);
        }
      });
      if (bluetoothIndex !== -1) {
        selectedAudioDevice = availableAudioDevices.at(bluetoothIndex);
      } else if (wiredHeadsetIndex !== -1) {
        selectedAudioDevice = availableAudioDevices.at(wiredHeadsetIndex);
      } else if (this.call.isVideoCall) {
        if (speakerIndex !== -1) {
          selectedAudioDevice = availableAudioDevices.at(speakerIndex);
        }
      } else {
        if (earpieceIndex !== -1) {
          selectedAudioDevice = availableAudioDevices.at(earpieceIndex);
        }
      }
    }
    this.selectDevice(selectedAudioDevice);
  };

  // Invoked when local track in video call is ready to play
  onReceiveLocalTrack = (_, track) => {
    console.log('onReceiveLocalTrack', track);
    if (this.events) {
      this.events.onReceiveLocalTrack(track);
    }
  };

  // Invoked when remote track in video call is ready to play
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
  };

  constructor() {}
  /**
   * Make a call
   * @function makeCall
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
    this.setListenerForCall1();
    this.call
      .makeCall()
      .then(() => {
        this.startAudioManager();
      })
      .catch(console.log);
  }

  /**
   * Make a call2
   * @function makeCall2
   * @param {string} to To user_id or phone_number
   * @param {boolean} isVideoCall The call is video call or not
   */
  makeCall2(to, isVideoCall) {
    this.call = new StringeeCall2({
      stringeeClient: StringeeClientManager.instance.client,
      from: StringeeClientManager.instance.client.userId,
      to: to,
    });
    this.call.isVideoCall = isVideoCall;
    this.callType = CallType.out;
    this.setListenerForCall2();
    this.call
      .makeCall()
      .then(() => {
        this.startAudioManager();
      })
      .catch(console.log);
  }

  /**
   * The call finish, reset manager
   * @function endCallSection
   */
  endCallSection() {
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
   * Handle incoming call from stringee server
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
    this.initAnswer();
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

  // Show incoming call notification in android
  async showIncomingCallNotification(from: string) {
    // Create your notification channel
    const channelId = await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      description: CHANNEL_DESCRIPTION,
      vibration: true,
      importance: AndroidImportance.HIGH, // Must be HIGH for display notification over other app
    });
    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: 'Incoming Call',
      body: 'Call from ' + from,
      android: {
        channelId,
        importance: AndroidImportance.HIGH, // Must be HIGH for display notification over other app
        category: AndroidCategory.CALL, // Must be CALL for display notification like system call notification
        autoCancel: false,
        ongoing: true,
        // Press on the notification
        pressAction: {
          id: OPEN_APP_ACTION_ID,
          launchActivity: 'default', // `default` will open your MainActivity
        },
        // Create 2 action button: Answer, Reject
        actions: [
          {
            title: 'Answer',
            pressAction: {
              id: ANSWER_ACTION_ID,
              launchActivity: 'default', // `default` will open your MainActivity
            },
          },
          {
            title: 'Reject',
            pressAction: {
              id: REJECT_ACTION_ID,
            },
          },
        ],
        // Show full screen notification
        fullScreenAction: {
          id: OPEN_APP_IN_FULL_SCREEN_MODE_ACTION_ID,
          launchActivity: 'default', // `default` will open your MainActivity
        },
      },
    });
  }

  /**
   * Init answer the call
   */
  initAnswer() {
    if (this.call) {
      this.call
        .initAnswer()
        .then(() => {
          if (this.events) {
            this.events.onChangeSignalingState(SignalingState.ringing);
            if (isIos) {
              this.answerStringeeCallIfConditionMatch();
            }
          }
        })
        .catch(console.log);
    }
  }

  /**
   * Set mute/unmute micro
   * @param {boolean} isMute
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
   * Switch camera
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
   * Set call listener for StringeeCall
   */
  setListenerForCall1() {
    if (this.call) {
      this.call.setListener(this.callEvents);
    }
  }

  /**
   * Set call listener for StringeeCall2
   */
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
   * Start audio manager
   */
  startAudioManager() {
    this.audioListener.onAudioDeviceChange = this.onAudioDeviceChange;
    StringeeAudioManager.getInstance().addListener(this.audioListener);
    StringeeAudioManager.getInstance().start().then().catch(console.log);
  }

  /**
   * Stop audio manager
   */
  stopAudioManager() {
    StringeeAudioManager.getInstance().removeListener(this.audioListener);
    StringeeAudioManager.getInstance().stop().then().catch(console.log);
  }

  /**
   * Enable/Disable camera
   * @param {boolean} isEnable Camera is on or off
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
   * Select audio device
   * @param {AudioDevice} audioDevice
   */
  selectDevice(audioDevice: AudioDevice) {
    if (this.call) {
      StringeeAudioManager.getInstance()
        .selectDevice(audioDevice)
        .then(() => {
          this.audioDevice = audioDevice;
          if (this.events) {
            this.events.onAudioDeviceChange(audioDevice);
          }
        })
        .catch(console.log);
      if (this.callKeeps) {
        RNCallKeep.toggleAudioRouteSpeaker(
          this.callKeeps.uuid,
          audioDevice.audioType === AudioType.speakerPhone,
        );
      }
    }
  }

  /**
   * Answer the call
   */
  answer(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.call && !isIos) {
        this.call
          .answer()
          .then(() => {
            InCallManager.stopRingtone();
            this.startAudioManager();
            resolve();
          })
          .catch(() => reject());
      } else if (this.callKeeps) {
        // Synchronize call answering with CallKeep
        RNCallKeep.answerIncomingCall(this.callKeeps.uuid);
      }
      this.signalingState = SignalingState.answered;
    });
  }

  /**
   * Hang up the call
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
   * Reject the call
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
   * Display callkeep if need in ios
   * @param {object} data data from call keep
   */

  displayCallKeepIfNeed(data) {
    this.callKeeps = data;
    // Whether the incoming call is show on native screen or not
    RNCallKeep.getCalls().then(items => {
      if (
        items.find(item => {
          return item.callUUID === data.uuid;
        }) == null &&
        !this.callkeepRejected.includes(data.uuid)
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
        // User reject the call before the StringeeClient receive incomingCall event
        if (this.callkeepRejected.includes(data.uuid)) {
          this.call
            .reject()
            .then(() => {})
            .catch(console.log);
        }
      }
    });
  }

  answerStringeeCallIfConditionMatch() {
    /*
     Handle calls synchronously with native iOS. To ensure calls are answered, ensure:
       + Event active audio section has been called
       + Receive call from StringeeServer
       + The call.initAnswer function is called
       + User answers the call.
    */
    if (!this.didActiveAudioSection) {
      console.log('The audio section has not been activated yet');
    }
    if (this.call == null) {
      console.log('Have not received a call from StringeeServer');
    }

    if (this.callKeeps && this.callkeepAnswered.includes(this.callKeeps.uuid)) {
      this.call
        .answer()
        .then(() => {
          this.didAnswer();
          this.startAudioManager();
        })
        .catch(console.log);
    } else {
      console.log('The user has not answered the call');
    }
  }

  callKeepEndCall(uuid) {
    /*
      In case the user presses endcall from the callkeep side but the sdk has not recorded the push call into the callkeepRejected array for later processing.
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
