# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
-dontwarn org.webrtc.**
-dontwarn com.google.android.gms.internal.zzbeb
-dontwarn com.google.android.gms.internal.zzbec
-keep class org.webrtc.** { *; }
-dontwarn org.apache.http.**
-keep class org.apache.http.** { *; }
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** w(...);
    public static *** v(...);
    public static *** i(...);
    public static *** e(...);
}
