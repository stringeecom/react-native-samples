package com.onetoonecallsample;

import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.FirebaseInstanceIdService;
import com.stringee.StringeeClient;
import com.stringeereactnative.StringeeManager;

public class MyFirebaseInstanceIDService extends FirebaseInstanceIdService {

    private final String TAG = "Stringee";

    @Override
    public void onTokenRefresh() {
        String token = FirebaseInstanceId.getInstance().getToken();
        StringeeClient client = StringeeManager.getInstance().getClient();
        if (client != null && client.isConnected()) {
            client.registerPushToken(token, null);
        }
    }
}
