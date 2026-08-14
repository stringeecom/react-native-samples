package com.livechatsample;

import android.content.Context;
import com.facebook.react.ReactInstanceManager;

/** Provides the no-op Flipper implementation used by release builds. */
public class ReactNativeFlipper {
  /** Leaves Flipper disabled in release builds. */
  public static void initializeFlipper(Context context, ReactInstanceManager reactInstanceManager) {
    // Flipper is available only in the debug source set.
  }
}
