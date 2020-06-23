package com.stringeereactnative;

import android.support.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.stringee.call.StringeeCall;
import com.stringee.common.StringeeConstant;
import com.stringee.exception.StringeeError;
import com.stringee.listener.StatusListener;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

public class RNStringeeCallModule extends ReactContextBaseJavaModule implements StringeeCall.StringeeCallListener {

    private Callback mCallback;
    private ArrayList<String> jsEvents = new ArrayList<String>();

    public RNStringeeCallModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "RNStringeeCall";
    }

    @ReactMethod
    public void makeCall(String params, Callback callback) {
        mCallback = callback;
        if (StringeeManager.getInstance().getClient() == null) {
            callback.invoke(false, -1, "StringeeClient is not initialized or connected.", "");
            return;
        }

        if (!StringeeManager.getInstance().getClient().isConnected()) {
            callback.invoke(false, -1, "StringeeClient is not initialized or connected.", "");
            return;
        }
        try {
            JSONObject jsonObject = new JSONObject(params);
            String from = jsonObject.getString("from");
            String to = jsonObject.getString("to");
            boolean isVideoCall = jsonObject.getBoolean("isVideoCall");
            String customData = jsonObject.optString("customData");
            String resolution = jsonObject.optString("videoResolution");


            StringeeCall mStringeeCall = new StringeeCall(getReactApplicationContext(), StringeeManager.getInstance().getClient(), from, to);
            mStringeeCall.setCallListener(this);
            mStringeeCall.setVideoCall(isVideoCall);
            if (customData != null) {
                mStringeeCall.setCustom(customData);
            }
            if (resolution != null) {
                if (resolution.equalsIgnoreCase("NORMAL")) {
                    mStringeeCall.setQuality(StringeeConstant.QUALITY_NORMAL);
                } else if (resolution.equalsIgnoreCase("HD")) {
                    mStringeeCall.setQuality(StringeeConstant.QUALITY_HD);
                }
            }
            mStringeeCall.makeCall();
        } catch (JSONException e) {
            callback.invoke(false, -4, "The parameters format is invalid.", "");
            return;
        }
    }

    @ReactMethod
    public void initAnswer(String callId, Callback callback) {
        if (StringeeManager.getInstance().getClient() == null || !StringeeManager.getInstance().getClient().isConnected()) {
            callback.invoke(false, -1, "StringeeClient is not initialized or connected.");
            return;
        }

        if (callId == null || callId.length() == 0) {
            callback.invoke(false, -2, "The call id is invalid.");
            return;
        }

        StringeeCall call = StringeeManager.getInstance().getCallsMap().get(callId);
        if (call == null) {
            callback.invoke(false, -3, "The call is not found.");
            return;
        }
        call.setCallListener(this);
        call.initAnswer(getReactApplicationContext(), StringeeManager.getInstance().getClient());
        callback.invoke(true, 0, "Success");
    }

    @ReactMethod
    public void answer(String callId, Callback callback) {
        if (StringeeManager.getInstance().getClient() == null || !StringeeManager.getInstance().getClient().isConnected()) {
            callback.invoke(false, -1, "StringeeClient is not initialized or connected.");
            return;
        }

        if (callId == null || callId.length() == 0) {
            callback.invoke(false, -2, "The call id is invalid.");
            return;
        }

        StringeeCall call = StringeeManager.getInstance().getCallsMap().get(callId);
        if (call == null) {
            callback.invoke(false, -3, "The call is not found.");
            return;
        }
        call.answer();
        callback.invoke(true, 0, "Success");
    }

    @ReactMethod
    public void reject(String callId, Callback callback) {
        if (StringeeManager.getInstance().getClient() == null || !StringeeManager.getInstance().getClient().isConnected()) {
            callback.invoke(false, -1, "StringeeClient is not initialized or connected.");
            return;
        }

        if (callId == null || callId.length() == 0) {
            callback.invoke(false, -2, "The call id is invalid.");
            return;
        }

        StringeeCall call = StringeeManager.getInstance().getCallsMap().get(callId);
        if (call == null) {
            callback.invoke(false, -3, "The call is not found.");
            return;
        }
        call.reject();
        callback.invoke(true, 0, "Success");
    }

    @ReactMethod
    public void hangup(String callId, Callback callback) {
        if (StringeeManager.getInstance().getClient() == null || !StringeeManager.getInstance().getClient().isConnected()) {
            callback.invoke(false, -1, "StringeeClient is not initialized or connected.");
            return;
        }

        if (callId == null || callId.length() == 0) {
            callback.invoke(false, -2, "The call id is invalid.");
            return;
        }

        StringeeCall call = StringeeManager.getInstance().getCallsMap().get(callId);
        if (call == null) {
            callback.invoke(false, -3, "The call is not found.");
            return;
        }
        call.hangup();
        callback.invoke(true, 0, "Success");
    }

    @ReactMethod
    public void enableVideo(String callId, boolean enabled, Callback callback) {
        if (StringeeManager.getInstance().getClient() == null || !StringeeManager.getInstance().getClient().isConnected()) {
            callback.invoke(false, -1, "StringeeClient is not initialized or connected.");
            return;
        }

        if (callId == null || callId.length() == 0) {
            callback.invoke(false, -2, "The call id is invalid.");
            return;
        }

        StringeeCall call = StringeeManager.getInstance().getCallsMap().get(callId);
        if (call == null) {
            callback.invoke(false, -3, "The call is not found.");
            return;
        }
        call.enableVideo(enabled);
        callback.invoke(true, 0, "Success");
    }

    @ReactMethod
    public void mute(String callId, boolean isMute, Callback callback) {
        if (callId == null || callId.length() == 0) {
            callback.invoke(false, -2, "The call id is invalid.");
            return;
        }

        StringeeCall call = StringeeManager.getInstance().getCallsMap().get(callId);
        if (call == null) {
            callback.invoke(false, -3, "The call is not found.");
            return;
        }

        call.mute(isMute);
        callback.invoke(true, 0, "Success");
    }

    @ReactMethod
    public void sendCallInfo(String callId, String info, Callback callback) {
        if (StringeeManager.getInstance().getClient() == null || !StringeeManager.getInstance().getClient().isConnected()) {
            callback.invoke(false, -1, "StringeeClient is not initialized or connected.");
            return;
        }

        if (callId == null || callId.length() == 0) {
            callback.invoke(false, -2, "The call id is invalid.");
            return;
        }

        StringeeCall call = StringeeManager.getInstance().getCallsMap().get(callId);
        if (call == null) {
            callback.invoke(false, -3, "The call is not found.");
            return;
        }
        try {
            JSONObject jsonObject = new JSONObject(info);
            call.sendCallInfo(jsonObject);
            callback.invoke(true, 0, "Success");
        } catch (JSONException e) {
            callback.invoke(false, -4, "The call info format is invalid.");
        }
    }

    @ReactMethod
    public void sendDTMF(String callId, String key, final Callback callback) {
        if (StringeeManager.getInstance().getClient() == null || !StringeeManager.getInstance().getClient().isConnected()) {
            callback.invoke(false, -1, "StringeeClient is not initialized or connected.");
            return;
        }

        if (callId == null || callId.length() == 0) {
            callback.invoke(false, -2, "The call id is invalid.");
            return;
        }

        StringeeCall call = StringeeManager.getInstance().getCallsMap().get(callId);
        if (call == null) {
            callback.invoke(false, -3, "The call is not found.");
            return;
        }
        call.sendDTMF(key, new StatusListener() {
            @Override
            public void onSuccess() {
                callback.invoke(true, 0, "Success");
            }

            @Override
            public void onError(StringeeError error) {
                callback.invoke(false, error.getCode(), error.getMessage());
            }
        });
    }

    @ReactMethod
    public void switchCamera(String callId, Callback callback) {
        if (callId == null || callId.length() == 0) {
            callback.invoke(false, -2, "The call id is invalid.");
            return;
        }

        StringeeCall call = StringeeManager.getInstance().getCallsMap().get(callId);
        if (call == null) {
            callback.invoke(false, -3, "The call is not found.");
            return;
        }
        call.switchCamera(null);
        callback.invoke(true, 0, "Success");
    }

    @ReactMethod
    public void getCallStats(String callId, final Callback callback) {
        if (StringeeManager.getInstance().getClient() == null || !StringeeManager.getInstance().getClient().isConnected()) {
            callback.invoke(false, -1, "StringeeClient is not initialized or connected.", "");
            return;
        }

        if (callId == null || callId.length() == 0) {
            callback.invoke(false, -2, "The call id is invalid.", "");
            return;
        }

        StringeeCall call = StringeeManager.getInstance().getCallsMap().get(callId);
        if (call == null) {
            callback.invoke(false, -3, "The call is not found.", "");
            return;
        }

        call.getStats(new StringeeCall.CallStatsListener() {
            @Override
            public void onCallStats(StringeeCall.StringeeCallStats stringeeCallStats) {
                JSONObject jsonObject = new JSONObject();
                try {
                    jsonObject.put("bytesReceived", stringeeCallStats.callBytesReceived);
                    jsonObject.put("packetsLost", stringeeCallStats.callPacketsLost);
                    jsonObject.put("packetsReceived", stringeeCallStats.callPacketsReceived);
                    jsonObject.put("timeStamp", stringeeCallStats.timeStamp);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
                callback.invoke(true, 0, "Success", jsonObject.toString());
            }
        });
    }

    @ReactMethod
    public void setSpeakerphoneOn(String callId, boolean on, Callback callback) {
        if (callId == null || callId.length() == 0) {
            callback.invoke(false, -2, "The call id is invalid.");
            return;
        }

        StringeeCall call = StringeeManager.getInstance().getCallsMap().get(callId);
        if (call == null) {
            callback.invoke(false, -3, "The call is not found.");
            return;
        }
        call.setSpeakerphoneOn(on);
        callback.invoke(true, 0, "Success");
    }

    @Override
    public void onSignalingStateChange(StringeeCall stringeeCall, StringeeCall.SignalingState signalingState, String reason, int sipCode, String sipReason) {
        if (contains(jsEvents, "onSignalingStateChange")) {
            if (signalingState == StringeeCall.SignalingState.CALLING) {
                StringeeManager.getInstance().getCallsMap().put(stringeeCall.getCallId(), stringeeCall);
                mCallback.invoke(true, 0, "Success", stringeeCall.getCallId(), stringeeCall.getCustomDataFromYourServer());
            }

            WritableMap params = Arguments.createMap();
            params.putString("callId", stringeeCall.getCallId());
            params.putInt("code", signalingState.getValue());
            params.putString("reason", reason);
            params.putInt("sipCode", sipCode);
            params.putString("sipReason", sipReason);
            sendEvent(getReactApplicationContext(), "onSignalingStateChange", params);
        }
    }

    @Override
    public void onError(StringeeCall stringeeCall, int code, String desc) {
        mCallback.invoke(false, code, desc, stringeeCall.getCallId(), stringeeCall.getCustomDataFromYourServer());
    }

    @Override
    public void onHandledOnAnotherDevice(StringeeCall stringeeCall, StringeeCall.SignalingState signalingState, String s) {
        if (contains(jsEvents, "onHandledOnAnotherDevice")) {
            WritableMap params = Arguments.createMap();
            params.putString("callId", stringeeCall.getCallId());
            params.putInt("code", signalingState.getValue());
            params.putString("description", s);
            sendEvent(getReactApplicationContext(), "onHandledOnAnotherDevice", params);
        }
    }

    @Override
    public void onMediaStateChange(StringeeCall stringeeCall, StringeeCall.MediaState mediaState) {
        if (contains(jsEvents, "onMediaStateChange")) {
            WritableMap params = Arguments.createMap();
            params.putString("callId", stringeeCall.getCallId());
            int code = -1;
            String desc = "";
            if (mediaState == StringeeCall.MediaState.CONNECTED) {
                code = 0;
                desc = "Connected";
            } else if (mediaState == StringeeCall.MediaState.DISCONNECTED) {
                code = 1;
                desc = "Disconnected";
            }
            params.putInt("code", code);
            params.putString("description", desc);
            sendEvent(getReactApplicationContext(), "onMediaStateChange", params);
        }
    }

    @Override
    public void onLocalStream(StringeeCall stringeeCall) {
        if (contains(jsEvents, "onLocalStream")) {
            WritableMap params = Arguments.createMap();
            params.putString("callId", stringeeCall.getCallId());
            sendEvent(getReactApplicationContext(), "onLocalStream", params);
        }
    }

    @Override
    public void onRemoteStream(StringeeCall stringeeCall) {
        if (contains(jsEvents, "onRemoteStream")) {
            WritableMap params = Arguments.createMap();
            params.putString("callId", stringeeCall.getCallId());
            sendEvent(getReactApplicationContext(), "onRemoteStream", params);
        }
    }

    @Override
    public void onCallInfo(StringeeCall stringeeCall, JSONObject jsonObject) {
        if (contains(jsEvents, "onCallInfo")) {
            WritableMap params = Arguments.createMap();
            params.putString("callId", stringeeCall.getCallId());
            params.putString("data", jsonObject.toString());
            sendEvent(getReactApplicationContext(), "onCallInfo", params);
        }
    }

    private void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableMap eventData) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, eventData);
    }

    @ReactMethod
    public void setNativeEvent(String event) {
        jsEvents.add(event);
    }

    @ReactMethod
    public void removeNativeEvent(String event) {
        jsEvents.remove(event);
    }

    private boolean contains(ArrayList array, String value) {

        for (int i = 0; i < array.size(); i++) {
            if (array.get(i).equals(value)) {
                return true;
            }
        }
        return false;
    }
}
