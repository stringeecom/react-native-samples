package com.stringeereactnative;

import com.stringee.StringeeClient;
import com.stringee.call.StringeeCall;
import com.stringee.conference.StringeeRoom;
import com.stringee.conference.StringeeStream;

import java.util.HashMap;
import java.util.Map;

public class StringeeManager {

    private static StringeeManager stringeeManager;
    private StringeeClient mClient;
    private Map<String, StringeeCall> callsMap = new HashMap<>();
    private Map<String, StringeeStream> streamsMap = new HashMap<>();
    private Map<Integer, StringeeRoom> roomsMap = new HashMap<>();

    public static synchronized StringeeManager getInstance() {
        if (stringeeManager == null) {
            stringeeManager = new StringeeManager();
        }

        return stringeeManager;
    }

    public StringeeClient getClient() {
        return mClient;
    }

    public void setClient(StringeeClient mClient) {
        this.mClient = mClient;
    }

    public Map<String, StringeeCall> getCallsMap() {
        return callsMap;
    }

    public void setCallsMap(Map<String, StringeeCall> callsMap) {
        this.callsMap = callsMap;
    }

    public Map<String, StringeeStream> getStreamsMap() {
        return streamsMap;
    }

    public void setStreamsMap(Map<String, StringeeStream> streamsMap) {
        this.streamsMap = streamsMap;
    }

    public Map<Integer, StringeeRoom> getRoomsMap() {
        return roomsMap;
    }

    public void setRoomsMap(Map<Integer, StringeeRoom> roomsMap) {
        this.roomsMap = roomsMap;
    }
}
