import type {
  AudioDevice,
  MediaState,
  SignalingState,
  StringeeCall,
  StringeeCall2,
  StringeeVideoTrack,
} from 'stringee-react-native-v2';
import {CALL_SCREEN_NAME, HOME_SCREEN_NAME} from '../const';

export type ActiveCall = StringeeCall | StringeeCall2;

export interface ClientInfo {
  isOnline: boolean;
  client_id: string;
}

export interface CallInfo {
  call_with: string;
  isVideo: boolean;
  useCall2: boolean;
  isIncoming: boolean;
}

export interface StringeeState {
  client: ClientInfo;
  call: CallInfo;
  signalState: SignalingState;
}

export interface RootState {
  stringee: StringeeState;
}

export type RootStackParamList = {
  [HOME_SCREEN_NAME]: undefined;
  [CALL_SCREEN_NAME]: undefined;
};

export interface CallKeepData {
  uuid: string;
  callId: string;
  callName: string;
}

export interface CallManagerEvents {
  onChangeSignalingState?: (state: SignalingState, reason?: string) => void;
  onReceiveRemoteStream?: () => void;
  onReceiveLocalStream?: () => void;
  onChangeMediaState?: (
    call: ActiveCall,
    state: MediaState,
    description: string,
  ) => void;
  onHandleOnAnotherDevice?: (
    state: SignalingState,
    description?: string,
  ) => void;
  onAudioDeviceChange?: (
    selected: AudioDevice,
    available: AudioDevice[],
  ) => void;
  onReceiveLocalTrack?: (track: StringeeVideoTrack) => void;
  onReceiveRemoteTrack?: (track: StringeeVideoTrack) => void;
}
