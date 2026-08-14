import {
  AudioDevice,
  MediaState,
  SignalingState,
  StringeeCall,
  StringeeCall2,
  StringeeCall2Listener,
  StringeeCallListener,
  type StringeeClient,
  StringeeVideoTrack,
} from 'stringee-react-native-v2';
import RNCallKeep from 'react-native-callkeep';
import InCallManager from 'react-native-incall-manager';
import {AppState} from 'react-native';
import {name} from '../../app.json';
import {ANSWER_ACTION_ID, isIos, REJECT_ACTION_ID} from '../const';
import type {ActiveCall, CallKeepData, CallManagerEvents} from '../types';
import {consumePendingNotificationAction} from '../storage';
import CallNotificationService from './CallNotificationService';

export const CallDirection = {
  incoming: 'CALL_IN',
  outgoing: 'CALL_OUT',
} as const;

type CallDirectionValue = (typeof CallDirection)[keyof typeof CallDirection];

/**
 * Owns the single active Stringee call and its native call presentation.
 *
 * This manager installs SDK listeners before call setup, makes Answer and
 * cleanup idempotent, and reconciles Stringee signaling with CallKeep on iOS
 * and Notifee foreground notifications on Android. React views consume its
 * state and callbacks without directly controlling platform call APIs.
 */
class StringeeCallManager {
  /** Shared owner of the application's single active call. */
  static instance = new StringeeCallManager();

  call: ActiveCall | null = null;
  callDirection: CallDirectionValue | null = null;
  callKeep: CallKeepData | null = null;
  didAnswer: (() => void) | null = null;
  events: CallManagerEvents | null = null;
  signalingState: SignalingState | null = null;
  didActiveAudioSession = false;

  answeredCallKeepUUIDs = new Set<string>();
  rejectedCallKeepUUIDs = new Set<string>();

  answerRequested = false;
  answerInFlight: Promise<void> | null = null;
  initializedForAnswer = false;
  ending = false;

  /** Indicates whether a call instance is currently retained. */
  get hasActiveCall(): boolean {
    return this.call != null;
  }

  /** Indicates whether the retained call is incoming. */
  get isIncomingCall(): boolean {
    return this.callDirection === CallDirection.incoming;
  }

  /** Checks that an event belongs to the retained call. */
  matchesCallId(callId: string): boolean {
    return Boolean(
      this.call &&
        (!callId || !this.call.callId || this.call.callId === callId),
    );
  }

  /** Receives and forwards Stringee signaling-state changes. */
  onChangeSignalingState = (
    call: ActiveCall,
    signalingState: SignalingState,
    reason: string,
    sipCode: number,
    sipReason: string,
  ): void => {
    console.log(
      'onChangeSignalingState',
      signalingState,
      reason,
      sipCode,
      sipReason,
    );
    this.signalingState = signalingState;

    if (
      signalingState === SignalingState.ended ||
      signalingState === SignalingState.answered
    ) {
      this.stopRingtone();
    }

    this.events?.onChangeSignalingState?.(signalingState, reason);

    if (
      (signalingState === SignalingState.ended ||
        signalingState === SignalingState.busy) &&
      !this.events
    ) {
      this.endCallSession();
    }
  };

  /** Forwards the legacy remote-stream-ready callback to the active view. */
  onReceiveRemoteStream = (): void => {
    console.log('onReceiveRemoteStream');
    this.events?.onReceiveRemoteStream?.();
  };

  /** Forwards the legacy local-stream-ready callback to the active view. */
  onReceiveLocalStream = (): void => {
    console.log('onReceiveLocalStream');
    this.events?.onReceiveLocalStream?.();
  };

  /** Forwards Stringee media-state changes to the active view. */
  onChangeMediaState = (
    call: ActiveCall,
    mediaState: MediaState,
    description: string,
  ): void => {
    console.log('onChangeMediaState', mediaState, description);
    this.events?.onChangeMediaState?.(call, mediaState, description);
  };

  /** Forwards cross-device signaling changes to the active view. */
  onHandleOnAnotherDevice = (
    call: ActiveCall,
    signalingState: SignalingState,
    description: string,
  ): void => {
    console.log('onHandleOnAnotherDevice', signalingState, description);
    this.events?.onHandleOnAnotherDevice?.(signalingState, description);
  };

  /** Forwards audio-route availability changes to the active view. */
  onAudioDeviceChange = (
    call: ActiveCall,
    selectedAudioDevice: AudioDevice,
    availableAudioDevices: AudioDevice[],
  ): void => {
    console.log(
      'onAudioDeviceChange',
      selectedAudioDevice,
      availableAudioDevices,
    );
    this.events?.onAudioDeviceChange?.(
      selectedAudioDevice,
      availableAudioDevices,
    );
  };

  /** Forwards the StringeeCall2 local video track to the active view. */
  onReceiveLocalTrack = (
    call: StringeeCall2,
    track: StringeeVideoTrack,
  ): void => {
    console.log('onReceiveLocalTrack', track);
    this.events?.onReceiveLocalTrack?.(track);
  };

  /** Forwards the StringeeCall2 remote video track to the active view. */
  onReceiveRemoteTrack = (
    call: StringeeCall2,
    track: StringeeVideoTrack,
  ): void => {
    console.log('onReceiveRemoteTrack', track);
    this.events?.onReceiveRemoteTrack?.(track);
  };

  /** Creates the listener implementation required by the selected call API. */
  createListener(
    useCall2: boolean,
  ): StringeeCallListener | StringeeCall2Listener {
    if (useCall2) {
      const listener = new StringeeCall2Listener();
      listener.onChangeSignalingState = this.onChangeSignalingState;
      listener.onChangeMediaState = this.onChangeMediaState;
      listener.onHandleOnAnotherDevice = this.onHandleOnAnotherDevice;
      listener.onAudioDeviceChange = this.onAudioDeviceChange;
      listener.onReceiveLocalTrack = this.onReceiveLocalTrack;
      listener.onReceiveRemoteTrack = this.onReceiveRemoteTrack;
      return listener;
    }

    const listener = new StringeeCallListener();
    listener.onChangeSignalingState = this.onChangeSignalingState;
    listener.onChangeMediaState = this.onChangeMediaState;
    listener.onHandleOnAnotherDevice = this.onHandleOnAnotherDevice;
    listener.onAudioDeviceChange = this.onAudioDeviceChange;
    listener.onReceiveLocalStream = this.onReceiveLocalStream;
    listener.onReceiveRemoteStream = this.onReceiveRemoteStream;
    return listener;
  }

  /**
   * Creates and starts an outgoing call.
   * @param client Connected Stringee client.
   * @param to Callee identifier.
   * @param isVideoCall Whether video is enabled initially.
   * @param useCall2 Whether to use StringeeCall2.
   * @returns Active call instance.
   */
  async makeCall(
    client: StringeeClient,
    to: string,
    isVideoCall: boolean,
    useCall2 = false,
  ): Promise<ActiveCall> {
    const callee = to.trim();

    if (!client.isConnected) {
      throw new Error(
        'Cannot make a call while StringeeClient is disconnected',
      );
    }
    if (!callee) {
      throw new Error('Callee id is required');
    }
    if (this.hasActiveCall) {
      throw new Error('There is already an active call');
    }

    const call: ActiveCall = useCall2
      ? new StringeeCall2({
          stringeeClient: client,
          from: client.userId,
          to: callee,
        })
      : new StringeeCall({
          stringeeClient: client,
          from: client.userId,
          to: callee,
        });
    call.isVideoCall = isVideoCall;

    this.prepareCall(call, CallDirection.outgoing, useCall2);

    try {
      await call.makeCall();
      await call.setSpeakerphoneOn(isVideoCall);
      if (!isIos) {
        await CallNotificationService.instance.startInCallService(call);
      }
      return call;
    } catch (error) {
      this.endCallSession();
      throw error;
    }
  }

  /** Convenience wrapper that always creates a StringeeCall2 session. */
  makeCall2(
    client: StringeeClient,
    to: string,
    isVideoCall: boolean,
  ): Promise<ActiveCall> {
    return this.makeCall(client, to, isVideoCall, true);
  }

  /** Resets per-call guards, retains the call, and installs its SDK listener. */
  prepareCall(
    call: ActiveCall,
    direction: CallDirectionValue,
    useCall2: boolean,
  ): void {
    this.call = call;
    this.callDirection = direction;
    this.signalingState =
      direction === CallDirection.incoming
        ? SignalingState.ringing
        : SignalingState.calling;
    this.ending = false;
    this.answerRequested = false;
    this.answerInFlight = null;
    this.initializedForAnswer = false;
    if (useCall2 && call instanceof StringeeCall2) {
      call.setListener(this.createListener(true) as StringeeCall2Listener);
    } else if (call instanceof StringeeCall) {
      call.setListener(this.createListener(false) as StringeeCallListener);
    }
  }

  /** Prepares an incoming call for Android notifications or iOS CallKeep. */
  async handleIncomingCall(
    call: ActiveCall,
    useCall2 = call instanceof StringeeCall2,
  ): Promise<ActiveCall> {
    console.log('handleIncomingCall', call.callId);
    if (this.hasActiveCall) {
      await call.reject();
      throw new Error('There is already an active call');
    }

    this.prepareCall(call, CallDirection.incoming, useCall2);

    if (!isIos) {
      InCallManager.startRingtone('_BUNDLE_');
      await this.initializeAnswer();
      if (AppState.currentState !== 'active') {
        await CallNotificationService.instance.showIncomingCallNotification({
          callId: call.callId || '',
          caller: call.fromAlias || call.from,
          isVideo: Boolean(call.isVideoCall),
        });
      }
    }

    if (isIos) {
      try {
        const uuid = await call.generateUUID();
        await this.displayCallKeepIfNeeded({
          uuid,
          callId: call.callId,
          callName: call.fromAlias || call.from,
        });
      } catch (error) {
        console.log('Unable to prepare CallKeep call', error);
        await this.rejectCall();
        throw error;
      }
    }

    const handledAction = await this.applyPendingNotificationAction(
      call.callId,
    );
    if (handledAction === REJECT_ACTION_ID) {
      throw new Error('Call was rejected from the notification');
    }
    return call;
  }

  /** Applies a non-expired Answer or Reject action saved by Android notification handling. */
  async applyPendingNotificationAction(callId = ''): Promise<string | false> {
    if (!this.matchesCallId(callId)) {
      return false;
    }
    const pending = await consumePendingNotificationAction(
      this.call?.callId || callId,
    );
    if (!pending) {
      return false;
    }
    if (pending.action === ANSWER_ACTION_ID) {
      await this.answer();
    } else if (pending.action === REJECT_ACTION_ID) {
      await this.rejectCall();
    }
    return pending.action;
  }

  /** Initializes the SDK answer pipeline once for an incoming call. */
  async initializeAnswer(): Promise<void> {
    if (!this.call || !this.isIncomingCall || this.initializedForAnswer) {
      return;
    }
    await this.call.initAnswer();
    this.initializedForAnswer = true;
  }

  /** Displays an Android incoming-call notification for the retained call. */
  async showIncomingCallNotification(from: string): Promise<void> {
    await CallNotificationService.instance.showIncomingCallNotification({
      callId: this.call?.callId || '',
      caller: from,
      isVideo: Boolean(this.call?.isVideoCall),
    });
  }

  /** Mutes or unmutes both Stringee media and the iOS system call UI. */
  async mute(isMute: boolean): Promise<void> {
    if (!this.call) {
      return;
    }
    await this.call.mute(isMute);
    if (this.callKeep) {
      RNCallKeep.setMutedCall(this.callKeep.uuid, isMute);
    }
  }

  /** Switches between available cameras on the active video call. */
  async switchCamera(): Promise<void> {
    await this.call?.switchCamera();
  }

  /** Enables or disables local video for the active call. */
  async enableVideo(isEnabled: boolean): Promise<void> {
    await this.call?.enableVideo(isEnabled);
  }

  /** Updates the speaker route in both Stringee and CallKeep. */
  async enableSpeaker(isOn: boolean): Promise<void> {
    if (!this.call) {
      return;
    }
    await this.call.setSpeakerphoneOn(isOn);
    if (this.callKeep) {
      RNCallKeep.toggleAudioRouteSpeaker(this.callKeep.uuid, isOn);
    }
  }

  /** Requests an idempotent answer and coordinates platform prerequisites. */
  async answer(): Promise<void> {
    if (!this.call || !this.isIncomingCall) {
      return;
    }
    this.answerRequested = true;

    if (isIos) {
      if (this.callKeep) {
        RNCallKeep.answerIncomingCall(this.callKeep.uuid);
      }
      await this.answerStringeeCallIfReady();
      return;
    }

    await this.answerStringeeCallIfReady();
  }

  /** Answers once Stringee initialization and the iOS audio session are ready. */
  async answerStringeeCallIfReady(): Promise<void> {
    if (!this.call || !this.answerRequested || !this.isIncomingCall) {
      return;
    }
    if (isIos && !this.didActiveAudioSession) {
      console.log('Waiting for CallKit audio session');
      return;
    }
    if (this.answerInFlight) {
      return this.answerInFlight;
    }

    this.answerInFlight = (async () => {
      await this.initializeAnswer();
      if (!this.call || this.ending) {
        return;
      }
      await this.call.answer();
      this.signalingState = SignalingState.answered;
      this.stopRingtone();
      await CallNotificationService.instance.cancelIncomingCallNotification(
        this.call.callId || '',
      );
      if (!isIos) {
        await CallNotificationService.instance.startInCallService(this.call);
      }
      await this.call.setSpeakerphoneOn(this.call.isVideoCall);
      this.didAnswer?.();
    })();

    try {
      await this.answerInFlight;
    } finally {
      this.answerInFlight = null;
    }
  }

  /** Backward-compatible alias for {@link answerStringeeCallIfReady}. */
  answerStringeeCallIfConditionMatch(): Promise<void> {
    return this.answerStringeeCallIfReady();
  }

  /** Hangs up the active call and cleans its platform notification state. */
  async hangup(): Promise<void> {
    if (!this.call || this.ending) {
      return;
    }
    this.ending = true;
    if (this.callKeep) {
      RNCallKeep.endCall(this.callKeep.uuid);
    }
    try {
      await this.call.hangup();
    } finally {
      this.stopRingtone();
      if (!isIos) {
        await CallNotificationService.instance.cleanup(this.call?.callId || '');
      }
    }
  }

  /** Rejects an incoming call and cleans its platform notification state. */
  async rejectCall(): Promise<void> {
    if (!this.call || this.ending) {
      return;
    }
    this.ending = true;
    if (this.callKeep) {
      RNCallKeep.endCall(this.callKeep.uuid);
    }
    try {
      await this.call.reject();
    } finally {
      this.stopRingtone();
      if (!isIos) {
        await CallNotificationService.instance.cleanup(this.call?.callId || '');
      }
    }
  }

  /** Displays or reconciles the matching iOS CallKeep call. */
  async displayCallKeepIfNeeded(data: CallKeepData): Promise<void> {
    if (!isIos) {
      return;
    }
    this.callKeep = data;

    const calls = (await RNCallKeep.getCalls()) || [];
    const isDisplayed = calls.some(item => item.callUUID === data.uuid);
    if (!isDisplayed && !this.rejectedCallKeepUUIDs.has(data.uuid)) {
      RNCallKeep.displayIncomingCall(
        data.uuid,
        name,
        data.callName,
        'generic',
        Boolean(this.call?.isVideoCall),
      );
    }

    if (this.rejectedCallKeepUUIDs.has(data.uuid)) {
      await this.rejectCall();
      return;
    }
    if (this.answeredCallKeepUUIDs.has(data.uuid)) {
      this.answerRequested = true;
      await this.answerStringeeCallIfReady();
    }
  }

  /** Maps an iOS CallKeep end action to Reject or Hangup. */
  async callKeepEndCall(uuid: string): Promise<void> {
    if (!this.callKeep || uuid !== this.callKeep.uuid || !this.call) {
      this.rejectedCallKeepUUIDs.add(uuid);
      return;
    }
    if (
      this.isIncomingCall &&
      this.signalingState !== SignalingState.answered
    ) {
      await this.rejectCall();
    } else {
      await this.hangup();
    }
  }

  /** Stops the application ringtone on Android. */
  stopRingtone(): void {
    if (!isIos) {
      InCallManager.stopRingtone();
    }
  }

  /** Dismisses any remaining iOS system call UI. */
  finishSystemCallUI(): void {
    if (isIos) {
      RNCallKeep.endAllCalls();
    }
  }

  /**
   * Releases the retained call when the optional call ID matches.
   * @returns Whether the session was released.
   */
  endCallSession(callId = ''): boolean {
    if (callId && this.call?.callId && callId !== this.call.callId) {
      return false;
    }
    this.stopRingtone();
    if (!isIos) {
      CallNotificationService.instance.cleanup(callId).catch(console.log);
    }

    if (this.call) {
      this.call.setListener(null);
      this.call.clean();
    }

    this.call = null;
    this.callDirection = null;
    this.callKeep = null;
    this.didAnswer = null;
    this.events = null;
    this.signalingState = null;
    this.didActiveAudioSession = false;
    this.answerRequested = false;
    this.answerInFlight = null;
    this.initializedForAnswer = false;
    this.ending = false;
    this.answeredCallKeepUUIDs.clear();
    this.rejectedCallKeepUUIDs.clear();
    return true;
  }

  /** Backward-compatible alias that clears the current call section. */
  endCallSection(): void {
    this.endCallSession();
  }
}

export default StringeeCallManager;
