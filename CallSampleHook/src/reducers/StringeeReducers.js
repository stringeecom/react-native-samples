import {
  CALL_STATE_SCREEN,
  UPDATE_CALL_INFO,
  UPDATE_CALL_SCREEN,
  UPDATE_SIGNAL_STATE,
  USER_ONLINE_STAUS,
} from '../const';
import {SignalingState} from 'stringee-react-native-v2';

const INIT_STATE = {
  client: {
    isOnline: false,
    client_id: '',
  },
  call: {
    call_with: 'Callee',
  },
  callScreen: CALL_STATE_SCREEN.normal,
  signalState: SignalingState.ended,
};

const stringeeReducer = (state = INIT_STATE, action) => {
  switch (action.type) {
    case USER_ONLINE_STAUS:
      return {
        ...state,
        client: action.payload,
      };
    case UPDATE_CALL_INFO:
      return {
        ...state,
        call: action.payload,
      };
    case UPDATE_CALL_SCREEN:
      return {
        ...state,
        call_id: action.payload,
      };
    case UPDATE_SIGNAL_STATE:
      return {
        ...state,
        signalState: action.payload,
      };
    default:
      return state;
  }
};

export default stringeeReducer;
