import {
  UPDATE_CALL_INFO,
  UPDATE_SIGNAL_STATE,
  USER_ONLINE_STATUS,
} from '../../const';
import type {SignalingState} from 'stringee-react-native-v2';
import type {CallInfo, ClientInfo} from '../../types';

export const setClientInfo = (data: ClientInfo) =>
  ({
    type: USER_ONLINE_STATUS,
    payload: data,
  } as const);

export const setCallInfo = (callInfo: CallInfo) =>
  ({
    type: UPDATE_CALL_INFO,
    payload: callInfo,
  } as const);

export const setSignalState = (state: SignalingState) =>
  ({
    type: UPDATE_SIGNAL_STATE,
    payload: state,
  } as const);

export type StringeeAction =
  | ReturnType<typeof setClientInfo>
  | ReturnType<typeof setCallInfo>
  | ReturnType<typeof setSignalState>;
