package com.stringeechatsample;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

/** Hosts the JavaScript {@code StringeeChatSample} root component on Android. */
public class MainActivity extends ReactActivity {

  @Override
  protected String getMainComponentName() {
    return "StringeeChatSample";
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        DefaultNewArchitectureEntryPoint.getFabricEnabled());
  }
}
