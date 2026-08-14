import {SignalingState} from 'stringee-react-native-v2';
import stringeeReducer from '../src/reducers/StringeeReducers';
import {setClientInfo} from '../src/redux/actions';

jest.mock('stringee-react-native-v2', () => ({
  SignalingState: {
    calling: 'calling',
    ringing: 'ringing',
    answered: 'answered',
    busy: 'busy',
    ended: 'ended',
  },
}));

describe('stringeeReducer', () => {
  it('creates the initial call state', () => {
    const state = stringeeReducer(undefined, {type: '@@INIT'} as never);

    expect(state.client.isOnline).toBe(false);
    expect(state.signalState).toBe(SignalingState.calling);
  });

  it('stores connected client information', () => {
    const state = stringeeReducer(
      undefined,
      setClientInfo({isOnline: true, client_id: 'alice'}),
    );

    expect(state.client).toEqual({isOnline: true, client_id: 'alice'});
  });
});
