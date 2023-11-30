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
