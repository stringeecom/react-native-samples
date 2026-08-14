package com.callsamplehook;

import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.lang.reflect.Method;

/**
 * Exposes Android's full-screen-intent permission check to React Native.
 *
 * <p>Android 14 can require the user to explicitly allow full-screen call notifications. The
 * module checks that capability and opens the app-specific settings page when permission is
 * missing. Reflection keeps the sample source-compatible with its current compile SDK.
 */
public class FullScreenIntentModule extends ReactContextBaseJavaModule {
  FullScreenIntentModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "FullScreenIntent";
  }

  /**
   * Resolves whether full-screen intents are currently available.
   *
   * <p>On Android versions before 14 the capability is treated as granted. On Android 14 and
   * newer, the relevant settings screen is opened when user action is required.
   *
   * @param promise React Native promise resolved with the current permission state
   */
  @ReactMethod
  public void requestPermission(Promise promise) {
    if (Build.VERSION.SDK_INT < 34) {
      promise.resolve(true);
      return;
    }
    try {
      NotificationManager manager =
          (NotificationManager) getReactApplicationContext()
              .getSystemService(Context.NOTIFICATION_SERVICE);
      Method method = NotificationManager.class.getMethod("canUseFullScreenIntent");
      boolean granted = (boolean) method.invoke(manager);
      if (!granted) {
        Intent intent = new Intent("android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT");
        intent.setData(
            Uri.parse("package:" + getReactApplicationContext().getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getReactApplicationContext().startActivity(intent);
      }
      promise.resolve(granted);
    } catch (Exception error) {
      promise.reject("full_screen_intent_permission", error);
    }
  }
}
