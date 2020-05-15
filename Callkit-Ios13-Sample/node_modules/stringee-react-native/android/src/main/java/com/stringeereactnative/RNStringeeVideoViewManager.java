package com.stringeereactnative;

import android.util.Log;

import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

public class RNStringeeVideoViewManager extends ViewGroupManager<RNStringeeVideoLayout> {

    @Override
    public String getName() {
        return this.getClass().getSimpleName();
    }

    @Override
    protected RNStringeeVideoLayout createViewInstance(ThemedReactContext reactContext) {
        return new RNStringeeVideoLayout(reactContext);
    }

    @ReactProp(name = "callId")
    public void setCallId(RNStringeeVideoLayout layout, String callId) {
        layout.setCallId(callId);
        layout.updateView();
    }

    @ReactProp(name = "local", defaultBoolean = false)
    public void setLocal(RNStringeeVideoLayout layout, boolean isLocal) {
        layout.setLocal(isLocal);
        layout.updateView();
    }

    @ReactProp(name = "streamId")
    public void setStreamId(RNStringeeVideoLayout layout, String streamId) {
        layout.setStreamId(streamId);
        layout.updateView();
    }

    @ReactProp(name = "overlay", defaultBoolean = false)
    public void setOverlay(RNStringeeVideoLayout layout, boolean isOverlay) {
        layout.setOverlay(isOverlay);
        layout.updateView();
    }
}
