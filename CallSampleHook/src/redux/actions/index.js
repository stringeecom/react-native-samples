import {
  UPDATE_CALL_INFO,
  UPDATE_CALL_SCREEN,
  UPDATE_SIGNAL_STATE,
  USER_ONLINE_STAUS,
} from '../../const';

export const setClientInfo = data => {
  return {
    type: USER_ONLINE_STAUS,
    payload: data,
  };
};

export const setCallInfo = callInfo => {
  return {
    type: UPDATE_CALL_INFO,
    payload: callInfo,
  };
};

export const setSignalState = state => {
  return {
    type: UPDATE_SIGNAL_STATE,
    payload: state,
  };
};
