import {
  isTerminalStringeePush,
  parseStringeePushData,
} from '../src/stringee_manager/PushPayload';

describe('Android Stringee push payload', () => {
  it('parses a Stringee JSON data message', () => {
    expect(
      parseStringeePushData({
        data: {
          stringeePushNotification: '1.0',
          data: JSON.stringify({callStatus: 'started', callId: 'call-1'}),
        },
      }),
    ).toEqual({callStatus: 'started', callId: 'call-1'});
  });

  it('ignores unrelated and malformed data messages', () => {
    expect(parseStringeePushData({data: {data: '{}'}})).toBeNull();
    expect(
      parseStringeePushData({
        data: {stringeePushNotification: '1.0', data: '{invalid'},
      }),
    ).toBeNull();
  });

  it('only treats answered on another device as terminal', () => {
    expect(isTerminalStringeePush({callStatus: 'busy'})).toBe(true);
    expect(
      isTerminalStringeePush({callStatus: 'answered', original: false}),
    ).toBe(true);
    expect(
      isTerminalStringeePush({callStatus: 'answered', original: true}),
    ).toBe(false);
  });
});
