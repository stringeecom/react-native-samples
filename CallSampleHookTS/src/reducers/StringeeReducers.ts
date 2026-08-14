import {
  UPDATE_CALL_INFO,
  UPDATE_SIGNAL_STATE,
  USER_ONLINE_STATUS,
} from '../const';
import {SignalingState} from 'stringee-react-native-v2';
import type {StringeeAction} from '../redux/actions';
import type {StringeeState} from '../types';

const INITIAL_STATE: StringeeState = {
  client: {
    isOnline: false,
    client_id: '',
  },
  call: {
    call_with: 'Callee',
    isVideo: false,
    useCall2: false,
    isIncoming: false,
  },
  signalState: SignalingState.calling,
};

const stringeeReducer = (
  state: StringeeState = INITIAL_STATE,
  action: StringeeAction,
): StringeeState => {
  switch (action.type) {
    case USER_ONLINE_STATUS:
      return {...state, client: action.payload};
    case UPDATE_CALL_INFO:
      return {...state, call: action.payload};
    case UPDATE_SIGNAL_STATE:
      return {...state, signalState: action.payload};
    default:
      return state;
  }
};

export default stringeeReducer;
