package com.onetoonecallsample;

import android.content.Intent;
import android.util.Log;

import com.evollu.react.fcm.MessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.stringee.StringeeClient;
import com.stringeereactnative.StringeeManager;

import org.json.JSONException;
import org.json.JSONObject;

public class MyFirebaseMessagingService extends MessagingService {
    private final String TAG = "Stringee";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Message data payload: " + remoteMessage.getData());
            String pushFromStringee = remoteMessage.getData().get("stringeePushNotification");
            if (pushFromStringee != null) { // Receive push notification from Stringee Server
                // Connect to Stringee Server here

                String data = remoteMessage.getData().get("data");
                try {
                    JSONObject jsonObject = new JSONObject(data);
                    String callStatus = jsonObject.getString("callStatus");
                    if (callStatus != null && callStatus.equals("started")) {
                        StringeeClient client = StringeeManager.getInstance().getClient();
                        if (client == null || !client.isConnected()) {
                            Intent i = new Intent(this, MyReactActivity.class);
                            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(i);
                        }
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
