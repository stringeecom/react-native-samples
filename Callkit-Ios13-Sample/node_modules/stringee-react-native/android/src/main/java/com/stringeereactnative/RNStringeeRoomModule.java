package com.stringeereactnative;

import android.support.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.stringee.conference.StringeeRoom;
import com.stringee.conference.StringeeStream;
import com.stringee.exception.StringeeError;
import com.stringee.listener.StringeeRoomListener;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class RNStringeeRoomModule extends ReactContextBaseJavaModule implements StringeeRoomListener, StringeeStream.StringeeStreamListener {

    private Callback mCallback;
    private StringeeStream localStream;
    private StringeeRoom mRoom;

    private ArrayList<String> jsEvents = new ArrayList<String>();
    private Map<String, Callback> callbacksMap = new HashMap<>();
    private Map<String, Callback> unsubscribeCallbackMap = new HashMap<>();

    public RNStringeeRoomModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "RNStringeeRoom";
    }

    @ReactMethod
    public void makeRoom(Callback callback) {
        mCallback = callback;

        if (StringeeManager.getInstance().getClient() == null) {
            callback.invoke(false, -1, "StringeeClient is not initialized or connected.", 0);
            return;
        }

        mRoom = new StringeeRoom(StringeeManager.getInstance().getClient());
        mRoom.setRoomListener(this);
        mRoom.makeRoom();
    }

    @ReactMethod
    public void destroy(int roomId, Callback callback) {
        if (StringeeManager.getInstance().getClient() == null) {
            callback.invoke(false, -1, "StringeeClient is not initialized or connected.");
            return;
        }

        if (roomId <= 0) {
            callback.invoke(false, -2, "The room id is invalid.");
            return;
        }

        StringeeRoom mRoom = StringeeManager.getInstance().getRoomsMap().get(roomId);
        if (mRoom == null) {
            callback.invoke(false, -3, "The room is not found.");
            return;
        }

        mRoom.leaveRoom();
        callback.invoke(true, 0, "Success");
    }

    @ReactMethod
    public void joinRoom(int roomId, Callback callback) {
        mCallback = callback;
        if (StringeeManager.getInstance().getClient() == null) {
            callback.invoke(false, -1, "StringeeClient is not initialized or connected.", roomId);
            return;
        }

        if (roomId <= 0) {
            callback.invoke(false, -2, "The room id is invalid.", roomId);
            return;
        }

        StringeeRoom mRoom = new StringeeRoom(StringeeManager.getInstance().getClient(), roomId);
        mRoom.setRoomListener(this);
        mRoom.joinRoom();
    }

    @ReactMethod
    public void publishLocalStream(int roomId, String config, Callback callback) {
        if (roomId <= 0) {
            callback.invoke(false, -1, "The room id is invalid.", "");
            return;
        }
        StringeeRoom mRoom = StringeeManager.getInstance().getRoomsMap().get(roomId);
        if (mRoom == null) {
            callback.invoke(false, -2, "The room is not found.", "");
            return;
        }
        localStream = new StringeeStream(getReactApplicationContext());
        localStream.setCustomId("local_stream_" + System.currentTimeMillis());
        localStream.setStreamListener(this);
        callbacksMap.put(localStream.getCustomId(), callback);
        mRoom.publish(localStream);
    }

    @ReactMethod
    public void subscribe(int roomId, String streamId, Callback callback) {
        if (roomId <= 0) {
            callback.invoke(false, -1, "The room id is invalid.");
            return;
        }
        StringeeRoom mRoom = StringeeManager.getInstance().getRoomsMap().get(roomId);
        if (mRoom == null) {
            callback.invoke(false, -2, "The room is not found.");
            return;
        }
        if (streamId == null) {
            callback.invoke(false, -3, "The stream id is not found.");
            return;
        }

        StringeeStream stream = StringeeManager.getInstance().getStreamsMap().get(streamId);
        if (stream == null) {
            callback.invoke(false, -4, "The stream is not found.");
            return;
        }

        callbacksMap.put(streamId, callback);
        mRoom.subscribe(stream);
    }

    @ReactMethod
    public void unPublishLocalStream(int roomId, String streamId, Callback callback) {
        if (roomId <= 0) {
            callback.invoke(false, -1, "The room id is invalid.");
            return;
        }
        StringeeRoom mRoom = StringeeManager.getInstance().getRoomsMap().get(roomId);
        if (mRoom == null) {
            callback.invoke(false, -2, "The room is not found.");
            return;
        }
        if (streamId == null) {
            callback.invoke(false, -3, "The stream id is not found.");
            return;
        }

        StringeeStream stream = StringeeManager.getInstance().getStreamsMap().get(streamId);
        if (stream == null) {
            callback.invoke(false, -4, "The stream is not found.");
            return;
        }

        callbacksMap.put(streamId, callback);
        mRoom.unpublish(stream);
    }

    @ReactMethod
    public void unSubscribe(int roomId, String streamId, Callback callback) {
        if (roomId <= 0) {
            callback.invoke(false, -1, "The room id is invalid.");
            return;
        }
        StringeeRoom mRoom = StringeeManager.getInstance().getRoomsMap().get(roomId);
        if (mRoom == null) {
            callback.invoke(false, -2, "The room is not found.");
            return;
        }
        if (streamId == null) {
            callback.invoke(false, -3, "The stream id is not found.");
            return;
        }

        StringeeStream stream = StringeeManager.getInstance().getStreamsMap().get(streamId);
        if (stream == null) {
            callback.invoke(false, -4, "The stream is not found.");
            return;
        }

        unsubscribeCallbackMap.put(streamId, callback);
        mRoom.unsubscribe(stream);
    }

    @ReactMethod
    public void turnOnCamera(boolean video, Callback callback) {
        if (localStream != null) {
            localStream.enableVideo(video);
            callback.invoke(true, 0, "Success");
        } else {
            callback.invoke(false, -1, "Error");
        }
    }

    @ReactMethod
    public void mute(boolean mute) {
        if (localStream != null) {
            localStream.mute(mute);
        }
    }

    @ReactMethod
    public void switchCamera() {
        if (localStream != null) {
            localStream.switchCamera();
        }
    }

    @ReactMethod
    public void setSpeakerphoneOn(boolean on) {
        if (mRoom != null) {
            mRoom.setSpeakerphoneOn(on);
        }
    }

    @ReactMethod
    public void getStats(int roomId, String streamId, boolean isVideoTrack, final Callback callback) {
        if (streamId == null) {
            callback.invoke(false, -1, "The stream id is not found.");
            return;
        }
        StringeeStream stream = StringeeManager.getInstance().getStreamsMap().get(streamId);
        if (stream == null) {
            callback.invoke(false, -2, "The stream is not found.");
            return;
        }

        stream.getStats(new StringeeStream.StringeeStreamStatsListener() {
            @Override
            public void onCallStats(StringeeStream.StringeeStreamStats stringeeStreamStats) {
                JSONObject jsonObject = new JSONObject();
                try {
                    jsonObject.put("bytesReceived", stringeeStreamStats.bytesReceived);
                    jsonObject.put("packetsLost", stringeeStreamStats.packetsLost);
                    jsonObject.put("packetsReceived", stringeeStreamStats.packetsReceived);
                    jsonObject.put("timeStamp", stringeeStreamStats.timeStamp);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
                callback.invoke(true, 0, "Success", jsonObject.toString());
            }
        });
    }

    @Override
    public void onRoomConnected(StringeeRoom stringeeRoom) {
        mCallback.invoke(true, 0, "Success", stringeeRoom.getId());
        if (contains(jsEvents, "onRoomConnected")) {
            WritableMap params = Arguments.createMap();
            params.putInt("roomId", stringeeRoom.getId());
            params.putArray("streams", Arguments.createArray());
            sendEvent(getReactApplicationContext(), "onRoomConnected", params);
        }
        StringeeManager.getInstance().getRoomsMap().put(stringeeRoom.getId(), stringeeRoom);
    }

    @Override
    public void onRoomDisconnected(StringeeRoom stringeeRoom) {
        if (contains(jsEvents, "onRoomDisconnected")) {
            WritableMap params = Arguments.createMap();
            params.putInt("roomId", stringeeRoom.getId());
            sendEvent(getReactApplicationContext(), "onRoomDisconnected", params);
        }
    }

    @Override
    public void onRoomError(StringeeRoom stringeeRoom, StringeeError stringeeError) {
        mCallback.invoke(false, stringeeError.getCode(), stringeeError.getMessage(), stringeeRoom.getId());
        if (contains(jsEvents, "onRoomError")) {
            WritableMap params = Arguments.createMap();
            params.putInt("roomId", stringeeRoom.getId());
            params.putInt("code", stringeeError.getCode());
            params.putString("message", stringeeError.getMessage());
            sendEvent(getReactApplicationContext(), "onRoomError", params);
        }
    }

    @Override
    public void onStreamAdded(StringeeStream stringeeStream) {
        StringeeManager.getInstance().getStreamsMap().put(stringeeStream.getId(), stringeeStream);
        if (contains(jsEvents, "onStreamAdded")) {
            WritableMap params = Arguments.createMap();
            params.putInt("roomId", stringeeStream.getRoom().getId());

            WritableNativeMap stream = new WritableNativeMap();
            stream.putString("userId", stringeeStream.getUserId());
            stream.putString("streamId", stringeeStream.getId());

            params.putMap("stream", stream);
            sendEvent(getReactApplicationContext(), "onStreamAdded", params);
        }
    }

    @Override
    public void onStreamRemoved(StringeeStream stringeeStream) {
        StringeeManager.getInstance().getStreamsMap().remove(stringeeStream.getId());
        if (contains(jsEvents, "onStreamRemoved")) {
            WritableMap params = Arguments.createMap();
            params.putInt("roomId", stringeeStream.getRoom().getId());

            WritableNativeMap stream = new WritableNativeMap();
            stream.putString("userId", stringeeStream.getUserId());
            stream.putString("streamId", stringeeStream.getId());

            params.putMap("stream", stream);
            sendEvent(getReactApplicationContext(), "onStreamRemoved", params);
        }
    }

    @Override
    public void onStreamPublished(StringeeStream stringeeStream, boolean b) {
        StringeeManager.getInstance().getStreamsMap().put(stringeeStream.getId(), stringeeStream);
        Callback callback = callbacksMap.get(stringeeStream.getCustomId());
        if (callback != null) {
            callback.invoke(true, 0, "Success", stringeeStream.getId(), b);
        }
    }

    @Override
    public void onStreamPublishError(StringeeStream stringeeStream, StringeeError stringeeError, boolean b) {
        Callback callback = callbacksMap.get(stringeeStream.getCustomId());
        if (callback != null) {
            callback.invoke(false, stringeeError.getCode(), stringeeError.getMessage(), stringeeStream.getId(), b);
        }
    }

    @Override
    public void onStreamUnPublished(StringeeStream stringeeStream) {
        Callback callback = callbacksMap.get(stringeeStream.getId());
        if (callback != null) {
            callback.invoke(true, 0, "Success");
        }
    }

    @Override
    public void onStreamUnPublishError(StringeeStream stringeeStream, StringeeError stringeeError) {
        Callback callback = callbacksMap.get(stringeeStream.getId());
        if (callback != null) {
            callback.invoke(false, stringeeError.getCode(), stringeeError.getMessage());
        }
    }

    @Override
    public void onStreamSubscribed(StringeeStream stringeeStream, boolean b) {
        Callback callback = callbacksMap.get(stringeeStream.getId());
        if (callback != null) {
            callback.invoke(true, 0, "Success", stringeeStream.getId(), b);
        }
    }

    @Override
    public void onStreamUnSubscribed(StringeeStream stringeeStream) {
        Callback callback = unsubscribeCallbackMap.get(stringeeStream.getId());
        if (callback != null) {
            callback.invoke(true, 0, "Success", stringeeStream.getId());
        }
    }

    @Override
    public void onStreamSubscribeError(StringeeStream stringeeStream, StringeeError stringeeError, boolean b) {
        Callback callback = callbacksMap.get(stringeeStream.getId());
        if (callback != null) {
            callback.invoke(false, stringeeError.getCode(), stringeeError.getMessage(), stringeeStream.getId(), b);
        }
    }

    @Override
    public void onStreamUnSubscribeError(StringeeStream stringeeStream, StringeeError stringeeError) {
        Callback callback = unsubscribeCallbackMap.get(stringeeStream.getId());
        if (callback != null) {
            callback.invoke(false, stringeeError.getCode(), stringeeError.getMessage());
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

    @Override
    public void onStreamMediaAvailable(StringeeStream stringeeStream) {
        if (contains(jsEvents, "onStreamMediaAvailable")) {
            WritableMap params = Arguments.createMap();
            boolean isLocal = false;
            if (stringeeStream.getId() == null) {
                isLocal = true;
            }
            params.putBoolean("isLocal", isLocal);
            params.putString("streamId", stringeeStream.getId());
            sendEvent(getReactApplicationContext(), "onStreamMediaAvailable", params);
        }
    }
}
