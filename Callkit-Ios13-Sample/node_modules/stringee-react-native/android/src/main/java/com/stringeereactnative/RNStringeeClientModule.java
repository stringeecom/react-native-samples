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
import com.stringee.StringeeClient;
import com.stringee.call.StringeeCall;
import com.stringee.exception.StringeeError;
import com.stringee.listener.StatusListener;
import com.stringee.listener.StringeeConnectionListener;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

public class RNStringeeClientModule extends ReactContextBaseJavaModule implements StringeeConnectionListener {

    private StringeeManager mStringeeManager;
    private StringeeClient mClient;
    private ArrayList<String> jsEvents = new ArrayList<String>();

    public RNStringeeClientModule(ReactApplicationContext context) {
        super(context);
        mStringeeManager = StringeeManager.getInstance();
    }

    @Override
    public String getName() {
        return "RNStringeeClient";
    }

    @ReactMethod
    public void init() {
        mClient = mStringeeManager.getClient();
        if (mClient == null) {
            mClient = new StringeeClient(getReactApplicationContext());
            mClient.setConnectionListener(this);
        }

        mStringeeManager.setClient(mClient);
    }

    @ReactMethod
    public void connect(String accessToken) {
        if (mClient.isConnected()) {
            if (contains(jsEvents, "onConnectionConnected")) {
                WritableMap params = Arguments.createMap();
                params.putString("userId", mClient.getUserId());
                params.putInt("projectId", mClient.getProjectId());
                params.putBoolean("isReconnecting", false);
                sendEvent(getReactApplicationContext(), "onConnectionConnected", params);
            }
        } else {
            mClient.connect(accessToken);
        }
    }

    @ReactMethod
    public void disconnect() {
        if (mClient != null) {
            mClient.disconnect();
        }
    }

    @ReactMethod
    public void registerPushToken(String token, final Callback callback) {
        if (mClient == null) {
            callback.invoke(false, -1, "StringeeClient is not initialized or connected");
            return;
        }

        mClient.registerPushToken(token, new StatusListener() {
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
    public void unregisterPushToken(final String token, final Callback callback) {
        if (mClient == null) {
            callback.invoke(false, -1, "StringeeClient is not initialized or connected");
            return;
        }

        mClient.unregisterPushToken(token, new StatusListener() {
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
    public void sendCustomMessage(String toUser, String msg, final Callback callback) {
        if (mClient == null) {
            callback.invoke(false, -1, "StringeeClient is not initialized or connected");
            return;
        }

        try {
            JSONObject jsonObject = new JSONObject(msg);
            mClient.sendCustomMessage(toUser, jsonObject, new StatusListener() {
                @Override
                public void onSuccess() {
                    callback.invoke(true, 0, "Success");
                }

                @Override
                public void onError(StringeeError error) {
                    callback.invoke(false, error.getCode(), error.getMessage());
                }
            });
        } catch (JSONException e) {
            e.printStackTrace();
            callback.invoke(false, -2, "Message is not not in JSON format");
        }
    }

    @Override
    public void onConnectionConnected(StringeeClient stringeeClient, boolean b) {
        if (contains(jsEvents, "onConnectionConnected")) {
            WritableMap params = Arguments.createMap();
            params.putString("userId", stringeeClient.getUserId());
            params.putInt("projectId", stringeeClient.getProjectId());
            params.putBoolean("isReconnecting", b);
            sendEvent(getReactApplicationContext(), "onConnectionConnected", params);
        }
    }

    @Override
    public void onConnectionDisconnected(StringeeClient stringeeClient, boolean b) {
        if (contains(jsEvents, "onConnectionDisconnected")) {
            WritableMap params = Arguments.createMap();
            params.putString("userId", stringeeClient.getUserId());
            params.putInt("projectId", stringeeClient.getProjectId());
            params.putBoolean("isReconnecting", b);
            sendEvent(getReactApplicationContext(), "onConnectionDisconnected", params);
        }
    }

    @Override
    public void onIncomingCall(StringeeCall stringeeCall) {
        if (contains(jsEvents, "onIncomingCall")) {
            StringeeManager.getInstance().getCallsMap().put(stringeeCall.getCallId(), stringeeCall);
            WritableMap params = Arguments.createMap();
            if (mClient != null) {
                params.putString("userId", mClient.getUserId());
            }
            params.putString("callId", stringeeCall.getCallId());
            params.putString("from", stringeeCall.getFrom());
            params.putString("to", stringeeCall.getTo());
            params.putString("fromAlias", stringeeCall.getFromAlias());
            params.putString("toAlias", stringeeCall.getToAlias());
            int callType = 1;
            if (stringeeCall.isPhoneToAppCall()) {
                callType = 3;
            }
            params.putInt("callType", callType);
            params.putBoolean("isVideoCall", stringeeCall.isVideoCall());
            params.putString("customDataFromYourServer", stringeeCall.getCustomDataFromYourServer());
            sendEvent(getReactApplicationContext(), "onIncomingCall", params);
        }
    }

    @Override
    public void onConnectionError(StringeeClient stringeeClient, StringeeError stringeeError) {
        if (contains(jsEvents, "onConnectionError")) {
            WritableMap params = Arguments.createMap();
            params.putInt("code", stringeeError.getCode());
            params.putString("message", stringeeError.getMessage());
            sendEvent(getReactApplicationContext(), "onConnectionError", params);
        }
    }

    @Override
    public void onRequestNewToken(StringeeClient stringeeClient) {
        if (contains(jsEvents, "onRequestNewToken")) {
            sendEvent(getReactApplicationContext(), "onRequestNewToken", null);
        }
    }

    @Override
    public void onCustomMessage(String s, JSONObject jsonObject) {
        if (contains(jsEvents, "onCustomMessage")) {
            WritableMap params = Arguments.createMap();
            params.putString("from", s);
            params.putString("data", jsonObject.toString());
            sendEvent(getReactApplicationContext(), "onCustomMessage", params);
        }
    }

    @Override
    public void onTopicMessage(String s, JSONObject jsonObject) {

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
