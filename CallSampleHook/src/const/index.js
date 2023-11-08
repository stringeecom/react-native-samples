// redux

import { Platform } from "react-native";

export const USER_ONLINE_STAUS = "stringee_client/user_is_online";
export const UPDATE_CALL_INFO = "stringee_call/call_info";
export const UPDATE_CALL_SCREEN = "call_screen/update_view";
export const UPDATE_SIGNAL_STATE = "stringee_call/update_signal_state";
// screen name
export const HOME_SCREEN_NAME = "HOME_SCREEN";
export const CALL_SCREEN_NAME = "CALL_SCREEN";
export const CHANNEL_ID: string = "channel_id";
export const CHANNEL_NAME: string = "channel_name";
export const CHANNEL_DESCRIPTION: string = "channel_description";
export const NOTIFICATION_ID: string = "notification_id";
export const OPEN_APP_ACTION_ID: string = "open_app";
export const OPEN_APP_IN_FULL_SCREEN_MODE_ACTION_ID: string =
  "open_app_in_full_screen_mode";
export const ANSWER_ACTION_ID: string = "answer";
export const REJECT_ACTION_ID: string = "reject";

export const isIos: boolean = Platform.OS === "ios";

export const CALL_STATE_SCREEN = {
  normal: "NORMAL_CALL",
  video_call: "VIDEO_CALL",
};

export const KEY_PUSH_REGISTERED: string = "push_registered";
