# Stringee React Native call sample (TypeScript)

This is the typed equivalent of `CallSampleHook`. Application code, Stringee
wrappers, managers, Redux state, tests, and React components use `.ts`/`.tsx`;
only the React Native bootstrap and framework configuration files remain
JavaScript where React Native 0.72 expects them.

The sample demonstrates `StringeeCall` and `StringeeCall2` voice/video calls
with complete incoming-call handling for foreground, background, and cold-start
application states.

## Included flows

- Connect, reconnect, and disconnect a `StringeeClient` with a persisted access
  token.
- Make and receive `StringeeCall` and `StringeeCall2` voice/video calls.
- Answer, reject, hang up, mute, switch speaker, enable video, and switch camera.
- Show the Stringee-style home and call views with local raster icons.
- Handle Android FCM and Notifee incoming-call notifications, including Answer,
  Reject, full-screen intent, and an active-call microphone foreground service.
- Handle iOS PushKit VoIP pushes and CallKeep actions, including events delivered
  before the React Native bridge is ready.
- Provide typed SDK listeners, call state, push payloads, native-module
  declarations, and manager APIs.

## Requirements

- Node.js 16 or newer and Yarn 1.x.
- Android Studio, Android SDK, and JDK 17 for Android builds.
- Xcode and CocoaPods for iOS builds.
- A Stringee access token for each test user.
- A Firebase project for Android incoming-call notifications.
- An Apple developer account, Push Notifications capability, and VoIP push
  configuration for iOS incoming calls.

Incoming FCM requires an Android device/emulator with Google Play services.
PushKit VoIP notifications must be tested on a physical iOS device; the iOS
Simulator can only validate compilation and outgoing/UI flows.

Never generate Stringee access tokens from an API secret inside the React
Native application. API secrets must remain on a trusted server.

## Setup

### Install dependencies

```shell
yarn install
cd ios
pod install
cd ..
```

The install hook replaces React Native 0.72's retired JFrog Boost URL with
`archives.boost.io` while preserving the original checksum so CocoaPods can
install reliably.

### Configure Stringee

Create access tokens on a trusted application server. Paste a valid token into
the connection screen at runtime.

After a successful connection, the sample persists the token and reconnects on
the next launch. Use **Logout** to unregister push, disconnect Stringee, and
clear the saved session.

### Configure Android notifications

1. Register application ID `com.callsamplehook` in Firebase.
2. Download `google-services.json` and place it at:

```text
android/app/google-services.json
```

3. Enable Firebase Cloud Messaging and upload the required FCM credentials to
   the Stringee dashboard.
4. Allow Camera, Microphone, Notifications, and Bluetooth permissions when the
   application requests them.
5. On Android 14 or newer, allow full-screen notifications when the sample
   opens the app-specific system setting.

`index.android.js` installs FCM and Notifee handlers before registering the
React component. Do not move this setup into a screen: background and cold-start
events can arrive before React views mount.

### Configure iOS notifications

1. Open `ios/CallSampleHook.xcworkspace` and select your development team.
2. Use a bundle identifier registered in the Apple Developer portal.
3. Enable **Push Notifications** and the **Voice over IP**, **Remote
   notifications**, and **Audio, AirPlay, and Picture in Picture** background
   modes.
4. Configure the corresponding APNs/VoIP credential in the Stringee dashboard.
5. Keep `aps-environment` as `development` for debug provisioning and use the
   production entitlement/profile for release builds.

PushKit is received in `AppDelegate.mm`, where the call is reported to CallKeep
immediately. `VoipPushManager` then restores the Stringee connection and
reconciles early CallKeep actions after JavaScript becomes available.

## TypeScript configuration

The project uses `module: "esnext"` and `moduleResolution: "bundler"`. This
matches Metro's resolution model and avoids the deprecated `node10` resolver
inherited from `@tsconfig/react-native@2.0.3`. Do not replace it with
`ignoreDeprecations`; run `yarn typecheck` after changing TypeScript or SDK
types.

### Run the sample

Start Metro in one terminal:

```bash
yarn start
```

Run the selected platform in another terminal:

```bash
yarn android
# or
yarn ios
```

In the application:

1. Enter a valid Stringee access token and select **Connect**.
2. Enter the other Stringee user ID.
3. Choose Voice or Video under either **Stringee Call** or **Stringee Call2**.
4. Use a second signed-in device/user to validate incoming calls and push
   notifications.

The token is persisted so a headless notification handler can reconnect after
the app is backgrounded or terminated. Logging out clears the saved token and
push registration.

## Connection and session flow

1. `StringeeClientManager` creates one `StringeeClient` and installs permanent
   SDK listeners.
2. `connect(token)` validates and persists the token before connecting.
3. On the next launch, the saved token is restored for automatic reconnection.
4. After `onConnect`, the current FCM or PushKit token is registered with
   Stringee.
5. When Stringee requests a new access token, the saved token is cleared and
   the UI asks the user for a replacement.
6. Logout unregisters push, clears saved call/push state and the access token,
   then disconnects.

## Four outgoing-call cases

| API | Voice | Video |
| --- | --- | --- |
| `StringeeCall` | Supported | Supported |
| `StringeeCall2` | Supported | Supported |

An outgoing call is accepted only when the client is connected, the callee ID
is not empty, and there is no other active call.

## Call lifecycle safeguards

- Only one active SDK call is retained at a time.
- SDK listeners are installed before `makeCall()` or `initAnswer()` starts.
- Answer waits for the required native audio state and cannot run after the
  active call has already been cleared.
- Repeated UI, SDK, notification, or CallKeep end events clean up the same call
  only once.
- Terminal SDK states clear local state without issuing an unnecessary second
  `hangup()` or `reject()` request.
- Audio state, notifications, foreground services, timers, and video views are
  released during cleanup.

## Call and notification architecture

- `StringeeWrapper` is the application-facing connect/disconnect/outgoing-call
  API.
- `StringeeClientManager` owns the SDK client, token persistence, reconnection,
  and push registration.
- `StringeeCallManager` owns the single active call and synchronizes Stringee,
  CallKeep, audio state, and Android notifications.
- `AndroidPushManager` handles FCM/Notifee foreground, background, and cold-start
  events.
- `CallNotificationService` owns Android incoming and active-call notifications.
- `VoipPushManager` reconciles PushKit and CallKeep events on iOS.
- `PushPayload` normalizes platform payloads and detects terminal call states.
- `src/types` contains shared application and native-module declarations.
- React screens render state and invoke managers; notification lifecycle logic
  remains outside the view layer.

## Verification

```bash
yarn typecheck
yarn lint
yarn test --runInBand --watchman=false

cd android
./gradlew app:assembleDebug
```

For iOS, build the `CallSampleHook` scheme from the workspace. A missing
`*.pcm` module error normally indicates stale Xcode DerivedData; use a clean or
new DerivedData location and rebuild.

## Troubleshooting

- If Metro serves stale JavaScript, restart it with
  `yarn start --reset-cache`.
- If VS Code reports that `moduleResolution=node10` is deprecated, ensure it is
  using the workspace TypeScript version and reload the TypeScript project.
- If incoming Android calls do not appear, verify FCM delivery, notification
  permission, full-screen-intent permission, and Google Play services.
- If an iOS incoming call does not appear, verify the physical device's VoIP
  token, provisioning profile, bundle identifier, and Stringee APNs setup.
- `firebase.json` is optional; React Native Firebase may print a warning when it
  is absent.

## Repository safety

Do not commit:

- Stringee access tokens, API secrets, or server private keys.
- Signing keystores, passwords, provisioning profiles, or private APNs keys.
- Machine-specific credentials or development overrides.

Firebase configuration files contain project identifiers and client API keys,
not Stringee server secrets. Whether they are committed should still follow the
owning Firebase project's repository policy.

# Learn more about stringee-react-native-v2 objects

## StringeeClient
Represents a Stringee client, manages the client's connection. This class provides methods to connect to/disconnect from Stringee server, manage Conversation, receives the connection's events, the incoming call event, Conversation and Message change event.

### Properties

##### userId: string
It's the unique identifier of the client on Stringee system.

##### isConnected: boolean
Whether the client connects to Stringee server:
- true: connected.
- false: not connected.

### Methods

##### setListener(stringeeClientListener: [StringeeClientListener](https://developer.stringee.com/docs/react-native-module/react-native-stringee-client-listener)): void
Set listener for StringeeClient.

##### connect(token: string): void
Connect to Stringee server using the provided access token.

##### disconnect(): void
Disconnect from Stringee server.

##### registerPush(deviceToken: string, isProduction: boolean, isVoip: boolean): Promise&lt;void&gt;
Register the registration deviceToken for push notifications to Stringee server.
For iOS need 2 values for register push:
- isProduction:
    + true: For production environment.
    + false: For development environment.
- isVoip:
    + true: To receive voip push notification.
    + false: To receive remote push notification.

##### unregisterPush(deviceToken: string): Promise&lt;void&gt;
Remove the registration deviceToken for push notifications from Stringee server.

## StringeeCall
Represents a voice, video call. Used to capture an audio-video stream from the device's microphone and camera for use to make or answer a call.

### Properties

##### callId: string
It's the unique identifier of the call on Stringee system.

##### from: string
It's the Caller's identifier.

##### to: string
It's the Callee's identifier.

##### isVideoCall: boolean
Whether the call is a video call:
- true: is a video call.
- false: is not a video call.

### Methods

##### setListener(stringeeCallListener: [StringeeCallListener](https://developer.stringee.com/docs/react-native-module/react-native-stringee-call-listener)): void
Set listener for StringeeCall.

##### makeCall(): Promise&lt;void&gt;
Make a call.

##### initAnswer(): Promise&lt;void&gt;
Initializes an answer. Must be called before answering a call.

##### answer(): Promise&lt;void&gt;
Answers a call.

##### hangup(): Promise&lt;void&gt;
Terminates a call.

##### reject(): Promise&lt;void&gt;
Reject a call.

##### switchCamera(): Promise&lt;void&gt;
Switches the device's camera.
By default, Stringee SDK uses the front camera.

##### enableVideo(enabled: boolean): Promise&lt;void&gt;
Enables or disables the local stream.

##### mute(mute: boolean): Promise&lt;void&gt;
Toggle audio on or off.

##### setSpeakerphoneOn(on: boolean): Promise&lt;void&gt;
Set the audio output mode.
If you want to use the device loudspeaker for playing audio, call the setSpeakerphoneOn(true) method.
Otherwise, call the setSpeakerphoneOn(false) method to use headset speaker for playing audio.

## StringeeCall2
Represents a voice, video call. Used to capture an audio-video stream from the device's microphone and camera for use to make or answer a call.

### Properties

##### callId: string
It's the unique identifier of the call on Stringee system.

##### from: string
It's the Caller's identifier.

##### to: string
It's the Callee's identifier.

##### isVideoCall: boolean
Whether the call is a video call:
- true: is a video call.
- false: is not a video call.

### Methods

##### setListener(stringeeCall2Listener: [StringeeCall2Listener](https://developer.stringee.com/docs/react-native-module/react-native-stringee-call2-listener)): void
Set listener for StringeeCall2.

##### makeCall(): Promise&lt;void&gt;
Make a call.

##### initAnswer(): Promise&lt;void&gt;
Initializes an answer. Must be called before answering a call.

##### answer(): Promise&lt;void&gt;
Answers a call.

##### hangup(): Promise&lt;void&gt;
Terminates a call.

##### reject(): Promise&lt;void&gt;
Reject a call.

##### switchCamera(): Promise&lt;void&gt;
Switches the device's camera.
By default, Stringee SDK uses the front camera.

##### enableVideo(enabled: boolean): Promise&lt;void&gt;
Enables or disables the local stream.

##### mute(mute: boolean): Promise&lt;void&gt;
Toggle audio on or off.

##### setSpeakerphoneOn(on: boolean): Promise&lt;void&gt;
Set the audio output mode.
If you want to use the device loudspeaker for playing audio, call the setSpeakerphoneOn(true) method.
Otherwise, call the setSpeakerphoneOn(false) method to use headset speaker for playing audio.

## StringeeClientListener
Represents the event from the StringeeClient.

### Methods

##### onConnect: (stringeeClient: [StringeeClient](https://developer.stringee.com/docs/react-native-module/stringeeclient), userId: string) => void
Invoked when the StringeeClient is connected.
- userId: It's the unique identifier of the client on Stringee system.

##### onDisConnect: (stringeeClient: [StringeeClient](https://developer.stringee.com/docs/react-native-module/stringeeclient)) => void
Invoked when the StringeeClient is disconnected.

##### onFailWithError: (stringeeClient: [StringeeClient](https://developer.stringee.com/docs/react-native-module/stringeeclient), code: number, message: string) => void
Invoked when StringeeClient connect false.
- userId: It's the unique identifier of the client on Stringee system.
- code = 1, message = "Access token is empty"
- code = 2, message = "Access token can not be decoded"
- code = 3, message = "Access token invalid format"
- code = 4, message = "Access token does not use HS256"
- code = 5, message = "API key sid or account sid not found"
- code = 6, message = "Access token expired or invalid"
- code = 7, message = "Access token invalid payload"
- code = 8, message = "Project not found"

##### onRequestAccessToken: (stringeeClient: [StringeeClient](https://developer.stringee.com/docs/react-native-module/stringeeclient)) => void
Invoked when your token is expired. You must get a new token and reconnect.

##### onIncomingCall: (stringeeClient: [StringeeClient](https://developer.stringee.com/docs/react-native-module/stringeeclient), stringeeCall: [StringeeCall](https://developer.stringee.com/docs/react-native-module/react-native-stringeecall)) => void
Invoked when receive an incoming of StringeeCall.

##### onIncomingCall2: (stringeeClient: [StringeeClient](https://developer.stringee.com/docs/react-native-module/stringeeclient), stringeeCall2: [StringeeCall2](https://developer.stringee.com/docs/react-native-module/react-native-stringeecall2) ) => void
Invoked when receive an incoming of StringeeCall2.

## StringeeCallListener
Represents the event from the StringeeCall.

### Methods

##### onChangeSignalingState: (stringeeCall: [StringeeCall](https://developer.stringee.com/docs/react-native-module/react-native-stringeecall), signalingState: [SignalingState](https://developer.stringee.com/docs/react-native-module/react-native-signaling-state), reason: string, sipCode: number, sipReason: string) => void
Invoked when the call's signaling state changes.
- signalingState: The signaling state of the call:
  + calling.
  + ringing.
  + answered.
  + ended.
  + busy.
- reason: The description of the state.
- sipCode: The sip code returned when the call is an app-to-phone call.
- sipReason: The description of sip code.

##### onChangeMediaState: (stringeeCall: [StringeeCall](https://developer.stringee.com/docs/react-native-module/react-native-stringeecall), mediaState: [MediaState](https://developer.stringee.com/docs/react-native-module/react-native-media-state), description: string) => void
Invoked when the call's media state changes.
- mediaState: The media state of the call:
  + connected: Used to specify the call media is connected.
  + disconnected: Used to specify the call media is disconnected.
- description: The description of the state.

##### onHandleOnAnotherDevice: (stringeeCall: [StringeeCall](https://developer.stringee.com/docs/react-native-module/react-native-stringeecall), signalingState: [SignalingState](https://developer.stringee.com/docs/react-native-module/react-native-signaling-state), reason: string) => void
Invoked when an incoming call is handle on another device.
- signalingState: The signaling state of the call:
  + calling.
  + ringing.
  + answered.
  + ended.
  + busy.
- reason: The description of the state.

##### onReceiveLocalStream: (stringeeCall: [StringeeCall](https://developer.stringee.com/docs/react-native-module/react-native-stringeecall)) => void
Invoked when local stream in video call is ready to play.

##### onReceiveRemoteStream: (stringeeCall: [StringeeCall](https://developer.stringee.com/docs/react-native-module/react-native-stringeecall)) => void
Invoked when remote stream in video call is ready to play.

##### onAudioDeviceChange: (stringeeCall: [StringeeCall](https://developer.stringee.com/docs/react-native-module/react-native-stringeecall), selectedAudioDevice: [AudioDevice](https://developer.stringee.com/docs/react-native-module/react-native-audio-device), availableAudioDevices: Array<[AudioDevice](https://developer.stringee.com/docs/react-native-module/react-native-audio-device)>) => void
Invoked when the current audio device changes in android.
- availableAudioDevices: List available audio devices on your android device.
- selectedAudioDevice: Audio device was selected:
  + speakerPhone : Speaker phone.
  + wiredHeadset : Wired headset.
  + earpiece : Earpiece.
  + bluetooth : Bluetooth headphone.
  + none : None device selected.

## StringeeCall2Listener
Represents the event from the StringeeCall2.

### Methods

##### onChangeSignalingState: (stringeeCall2: [StringeeCall2](https://developer.stringee.com/docs/react-native-module/react-native-stringeecall2), signalingState: [SignalingState](https://developer.stringee.com/docs/react-native-module/react-native-signaling-state), reason: string, sipCode: number, sipReason: string) => void
Invoked when the call's signaling state changes.
- signalingState: The signaling state of the call:
  + calling.
  + ringing.
  + answered.
  + ended.
  + busy.
- reason: The description of the state.
- sipCode: The sip code returned when the call is an app-to-phone call.
- sipReason: The description of sip code.

##### onChangeMediaState: (stringeeCall2: [StringeeCall2](https://developer.stringee.com/docs/react-native-module/react-native-stringeecall2), mediaState: [MediaState](https://developer.stringee.com/docs/react-native-module/react-native-media-state), description: string) => void
Invoked when the call's media state changes.
- mediaState: The media state of the call:
  + connected: Used to specify the call media is connected.
  + disconnected: Used to specify the call media is disconnected.
- description: The description of the state.

##### onHandleOnAnotherDevice: (stringeeCall2: [StringeeCall2](https://developer.stringee.com/docs/react-native-module/react-native-stringeecall2), signalingState: [SignalingState](https://developer.stringee.com/docs/react-native-module/react-native-signaling-state), reason: string) => void
Invoked when an incoming call is handle on another device.
- signalingState: The signaling state of the call:
  + calling.
  + ringing.
  + answered.
  + ended.
  + busy.
- reason: The description of the state.

##### onReceiveLocalTrack: (stringeeCall2: [StringeeCall2](https://developer.stringee.com/docs/react-native-module/react-native-stringeecall2), stringeeVideoTrack: [StringeeVideoTrack](https://developer.stringee.com/docs/react-native-module/react-native-stringee-video-track)) => void
Invoked when the local track is initialized and available to be rendered to a view..

##### onReceiveRemoteTrack: (stringeeCall2: [StringeeCall2](https://developer.stringee.com/docs/react-native-module/react-native-stringeecall2), stringeeVideoTrack: [StringeeVideoTrack](https://developer.stringee.com/docs/react-native-module/react-native-stringee-video-track)) => void
Invoked when the remote track is initialized and available to be rendered to a view.

##### onAudioDeviceChange: (stringeeCall2: [StringeeCall2](https://developer.stringee.com/docs/react-native-module/react-native-stringeecall2), selectedAudioDevice: [AudioDevice](https://developer.stringee.com/docs/react-native-module/react-native-audio-device), availableAudioDevices: Array<[AudioDevice](https://developer.stringee.com/docs/react-native-module/react-native-audio-device)>) => void
Invoked when the current audio device changes in android.
- availableAudioDevices: List available audio devices on your android device.
- selectedAudioDevice: Audio device was selected:
  + speakerPhone : Speaker phone.
  + wiredHeadset : Wired headset.
  + earpiece : Earpiece.
  + bluetooth : Bluetooth headphone.
  + none : None device selected.

## StringeeVideoView
Component for rendering the video streams.

### Properties

##### uuid: string
It's the unique identifier of the call.

##### videoTrack: [StringeeVideoTrack](https://developer.stringee.com/docs/react-native-module/react-native-stringee-video-track)
It's the video track.

##### local: boolean
Check whether the stream is local or remote:
- true: Local stream.
- false: Remote stream.
  By default is true.

##### scalingType: [StringeeVideoScalingType](https://developer.stringee.com/docs/react-native-module/react-native-stringee-video-scaling-type)
Scaling type of stream, by default is fill.

# Learn More

To learn more about `stringee-react-native-v2`, take a look at the following resources:

- [stringee-react-native-v2](https://www.npmjs.com/package/stringee-react-native-v2) - **stringee-react-native-v2 module** in npm.
- [Overview](https://developer.stringee.com/docs/call-api-overview) - an **overview** of call API from Stringee.
- [Getting Started with StringeeCall](https://asia-1.console.stringee.com/docs/getting-started-stringee-react-native-sdk) - a **Getting started document** of stringee-react-native-v2 module and how create a call project with StringeeCall.
- [Getting Started with StringeeCall2](https://asia-1.console.stringee.com/docs/getting-started-stringee-react-native-sdk2) - a **Getting started document** of stringee-react-native-v2 module and how create a call project with StringeeCall2.
- [API Reference](https://developer.stringee.com/docs/react-native-api-reference) - Specific details about the objects are in stringee-react-native-v2.
