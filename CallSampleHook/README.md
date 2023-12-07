This is a call sample project using [`stringee-react-native-v2`](https://www.npmjs.com/package/stringee-react-native-v2).

# Getting Started

## Step 1: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

### For iOS

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

# Learn more about CallSampleHook objects

## StringeeClientManager
The StringeeClientManager class is designed to handle various operations and maintain the overall state of the StringeeClient instance. It provides methods and functionality to establish a connection, disconnect from the Stringee server, register for push notifications, and perform other essential tasks related to managing the StringeeClient instance.

By encapsulating these functionalities within the StringeeClientManager, it becomes easier to organize and control the state transitions of the StringeeClient. The class acts as a central point for handling the client's operations and ensures consistent behavior across the application.

## StringeeCallManager
The StringeeCallManager class serves as a central component for managing and coordinating the state of call instances within the application. It provides methods and functionality to handle various call-related operations, including answering, rejecting, ending calls, and more.

## VoipPushManager
The StringeeCallManager and VoipPushManager work together to manage and synchronize incoming calls from the Apple VoIP Push Service and the Stringee SDK. The VoipPushManager acts as a bridge between these two sources, capturing incoming call events and passing them to the StringeeCallManager for further processing. This integration ensures seamless handling of incoming calls from both sources, enabling a consistent and unified approach to managing calls within the application.

# Use Stringee Manager Object on your Project

First, make sure you have installed the necessary libraries and configured the project according to the [Tutorial](https://developer.stringee.com/docs/call-api-overview) instructions.
And add all files in the **stringee_manager** directory to your project.

## Conect to Stringee Server
To use events from StringeeClient for your UI, assign a value to **StringeeClientManager.instance.listener** and then use **StringeeClientManager.instance.setListener()**.
for Example:

```javascript
    const clientListener = new StringeeClientListener();
    clientListener.onConnect = this.onConnect;
    clientListener.onDisConnect = this.onDisConnect;
    clientListener.onIncomingCall = this.onIncomingCall;
    clientListener.onIncomingCall2 = this.onIncomingCall2;
    clientListener.onFailWithError = this.onFailWithError;
    clientListener.onRequestAccessToken = this.onRequestAccessToken;

    StringeeClientManager.instance.listener = clientListener;
    StringeeClientManager.instance.setListener();
```

## Handle a Call
When receiving a call from the onIncomingCall event or when you want to initiate a call, send the received call information to the CallScreen interface.
for Example: 

```javascript
    const = onIncomingCall = (stringeeClient, call) => {
      dispatch(
        setCallInfo({
          call_with: call.fromAlias,
          isVideo: call.isVideoCall,
          useCall2: false,
          isIncoming: true,
        }),
      );
      navigation.navigate(CALL_SCREEN_NAME);
    };
```
To save time, you can directly use our provided CallScreen.js screen. However, if you prefer to design your own screen, don't worry. You can follow the instructions below.

### Setup a Call
Now that we have the call information from the previous screen, let's proceed with some logic such as initiating the call, enabling speakerphone if it's a video call, and so on.
```javascript
    if (!callInfo.isIncoming) {
      if (callInfo.useCall2) {
        StringeeCallManager.instance.makeCall2(
          callInfo.call_with,
          callInfo.isVideo,
        );
      } else {
        StringeeCallManager.instance.makeCall(
          callInfo.call_with,
          callInfo.isVideo,
        );
      }
    }
    setIsSpeakerOn(callInfo.isVideo);
```
### Register Call Event
To manage the UI for the call screen in your application, you can add events from the CallManager. These events can be used to handle various actions and updates during the call.
```javascript
    callEvents = {
        onChangeSignalingState: this.onChangeSignalingState,
        onReceiveRemoteStream: this.onReceiveRemoteStream,
        onReceiveLocalStream: this.onReceiveLocalStream,
        onChangeMediaState: this.onChangeMediaState,
        onHandleOnAnotherDevice: this.onHandleOnAnotherDevice,
        onAudioDeviceChange: this.onAudioDeviceChange,
        onReceiveRemoteStream: this.onReceiveRemoteStream,
        onReceiveLocalStream: this.onReceiveLocalStream,
        onReceiveRemoteTrack: this.onReceiveRemoteTrack,
        onReceiveLocalTrack: this.onReceiveLocalTrack
    };
    StringeeCallManager.instance.events = callEvents;
```

### Render StringeeVideoView
At this point, you may find it confusing to differentiate between `localStream` and `localTrack`, as well as `remoteStream` and `remoteTrack`. Don't worry, both of these events serve the purpose of displaying the `StringeeVideoView` for the call. In a call, you only need to use one of them.

You can disregard `localStream` and `remoteStream` if you are using `StringeeCall2`, and vice versa.

for Example: 
```javascript
    const onReceiveLocalTrack = track => {
        setLocalTrack(track);
    }

    const localVideoView = () => {
        return <StringeeVideoView
                    uuid={StringeeCallManager.instance.call.uuid}
                    local={true}
                    scalingType={'fit'}
                    overlay={true}
                    videoTrack={localTrack}
                    style={sheet.local_view_did_active_remote}
                >
    }
```

### Implement action incall

 You can easily implement user actions during a call, such as rejecting, hanging up, muting, switching cameras, and more, by using the corresponding functions in the StringeeCallManager.

Here are some examples of the functions you can use:

reject(): This function is used to reject an incoming call.

hangup(): This function is used to hang up an ongoing call.

mute(isMute): This function is used to mute or unmute the call, disabling the microphone.

switchCamera(): This function is used to switch between the front and rear cameras during a video call.

By utilizing these functions based on the user's actions, you can provide a comprehensive calling experience and allow users to interact with the call in various ways.

### Implement Push notification ios 

To integrate Apple VoIP Push notifications with RNCallKeep, you can synchronize the call using the `stringeePushConfig()` function in your `index.ios.js` file. This function helps configure the necessary settings for handling incoming calls and displaying push notifications.

By calling `stringeePushConfig()`, you can ensure that the necessary configurations are in place to receive VoIP Push notifications and handle incoming calls seamlessly within your React Native application.

In the ios/AppDelegate.m file, when receiving a call from the StringeeServer, use [RNStringeeInstanceManager.instance generateUUID:callId serial:serial] to generate a UUID for CallKeep. This step allows you to have control and synchronization over the call, whether it is in the native or React Native environment.

```objc
- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {
  NSDictionary *payloadDataDic = payload.dictionaryPayload[@"data"][@"map"][@"data"][@"map"];
  NSLog(@"didReceiveIncomingPushWithPayload: %@", payload.dictionaryPayload);
  NSString *callId = payloadDataDic[@"callId"];
  NSNumber *serial = payloadDataDic[@"serial"];
  NSString *callStatus = payloadDataDic[@"callStatus"];

  NSString *fromAlias = payloadDataDic[@"from"][@"map"][@"alias"];
  NSString *fromNumber = payloadDataDic[@"from"][@"map"][@"number"];
  NSString *callName = fromAlias != NULL ? fromAlias : fromNumber != NULL ? fromNumber : @"Connecting...";

      
  NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
  if (serial == NULL) {
    serial = @(1);
  }
  
  if (callId == NULL) {
    callId = payloadDataDic[@"content"][@"map"][@"message"][@"map"][@"call_id"];
  }
  
  NSString *uuid = [RNStringeeInstanceManager.instance generateUUID:callId serial:serial];

  if (uuid.length == 0) {
    uuid = [[[NSUUID UUID] UUIDString] lowercaseString];
  }
  
  NSLog(@"info %@ %@ %@", uuid, serial, callId);
  
  [dict setObject:uuid forKey:@"uuid"];
  [dict setObject:serial forKey:@"serial"];
  [dict setObject:callId forKey:@"callId"];
  [dict setObject:callName forKey:@"callName"];
  
  NSLog(@"voip push from stringee ---------------------");

  if (callId != NULL && [callStatus isEqual: @"started"]) {
    // --- Process the received push
    CustomPushPayload* customPayload = [[CustomPushPayload alloc] init];
    customPayload.customDictionaryPayload = dict;
    
    [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:customPayload forType:type];
    CXCallObserver *callObs = [[CXCallObserver alloc] init];
    BOOL didShow = false;
    
    for (CXCall * call in callObs.calls) {
      if ([call.UUID.UUIDString.lowercaseString isEqualToString:uuid]) {
        didShow = true;
      }
    }
    if (!didShow) {
      [RNCallKeep reportNewIncomingCall:uuid handle:@"Stringee" handleType:@"generic" hasVideo:true localizedCallerName:callName supportsHolding:false supportsDTMF:true supportsGrouping:false supportsUngrouping:false fromPushKit:true payload:nil withCompletionHandler:completion];
    }
  } else {
    // Show fake call
    NSLog(@"show fake call");
    [RNCallKeep reportNewIncomingCall:uuid handle:@"Stringee" handleType:@"generic" hasVideo:true localizedCallerName:callName supportsHolding:false supportsDTMF:true supportsGrouping:false supportsUngrouping:false fromPushKit:true payload:nil withCompletionHandler:completion];
    [RNCallKeep endCallWithUUID:uuid reason:1];
  }
}
```

By generating a UUID for CallKeep, you can ensure that the call is uniquely identified and properly synchronized between the native and React Native components, enabling seamless handling and management of the call across both platforms.



# Learn More

To learn more about `stringee-react-native-v2`, take a look at the following resources:

- [stringee-react-native-v2](https://www.npmjs.com/package/stringee-react-native-v2) - **stringee-react-native-v2 module** in npm.
- [Overview](https://developer.stringee.com/docs/call-api-overview) - an **overview** of call API from Stringee.
- [Getting Started with StringeeCall](https://asia-1.console.stringee.com/docs/getting-started-stringee-react-native-sdk) - a **Getting started document** of stringee-react-native-v2 module and how create a call project with StringeeCall.
- [Getting Started with StringeeCall2](https://asia-1.console.stringee.com/docs/getting-started-stringee-react-native-sdk2) - a **Getting started document** of stringee-react-native-v2 module and how create a call project with StringeeCall2.
- [API Reference](https://developer.stringee.com/docs/react-native-api-reference) - Specific details about the objects are in stringee-react-native-v2.
