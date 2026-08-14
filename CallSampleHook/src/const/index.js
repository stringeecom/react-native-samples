// redux

import {Platform} from 'react-native';

export const USER_ONLINE_STATUS = 'stringee_client/user_is_online';
export const UPDATE_CALL_INFO = 'stringee_call/call_info';
export const UPDATE_CALL_SCREEN = 'call_screen/update_view';
export const UPDATE_SIGNAL_STATE = 'stringee_call/update_signal_state';

// screen name

export const HOME_SCREEN_NAME = 'HOME_SCREEN';
export const CALL_SCREEN_NAME = 'CALL_SCREEN';

export const CHANNEL_ID = 'stringee_incoming_call_v2';
export const CHANNEL_NAME = 'Incoming calls';
export const CHANNEL_DESCRIPTION = 'Incoming Stringee call notifications';
export const NOTIFICATION_ID = 'stringee_incoming_call';
export const IN_CALL_CHANNEL_ID = 'stringee_in_call_v1';
export const IN_CALL_CHANNEL_NAME = 'Ongoing calls';
export const IN_CALL_NOTIFICATION_ID = 'stringee_in_call';
export const OPEN_APP_ACTION_ID = 'open_app';
export const OPEN_APP_IN_FULL_SCREEN_MODE_ACTION_ID =
  'open_app_in_full_screen_mode';
export const ANSWER_ACTION_ID = 'answer';
export const REJECT_ACTION_ID = 'reject';

export const isIos = Platform.OS === 'ios';

export const CALL_STATE_SCREEN = {
  normal: 'NORMAL_CALL',
  video_call: 'VIDEO_CALL',
};

export const KEY_PUSH_REGISTERED = 'push_registered';
export const KEY_PUSH_TOKEN = 'push_token';
export const KEY_ACCESS_TOKEN = 'stringee_access_token';
export const KEY_PENDING_NOTIFICATION_ACTION =
  'stringee_pending_notification_action';
export const KEY_INCOMING_NOTIFICATION_CALL_ID =
  'stringee_incoming_notification_call_id';
export const PENDING_NOTIFICATION_ACTION_TTL = 2 * 60 * 1000;
