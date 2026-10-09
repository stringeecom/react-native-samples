# StringeeChatSample

React Native `0.72.3` programmable-chat sample using
`stringee-react-native-v2`. It demonstrates conversations, participants,
messages, user information, typing state, and object-change events.

## Requirements

- Node.js 16 or newer and Yarn 1.x
- JDK 17 and Android SDK 33 or newer
- Xcode and CocoaPods for iOS; iOS 15 or later (Stringee iOS SDK `2.2.0`, referenced
  by podspec in `ios/Podfile`)
- A Stringee project with Chat enabled

## Configure

Replace `YOUR_ACCESS_TOKEN` in `App.js` with a current user access token. Handle
`onRequestAccessToken` by obtaining a fresh token from your trusted application
server and reconnecting the client.

Never generate a token from a Stringee API secret inside the application.

## Install and run

```shell
yarn install

cd ios
pod install
cd ..

yarn start
yarn android
# or: yarn ios
```

This project includes `.npmrc` with `legacy-peer-deps=true` because
`react-native-elements@3.4.2` declares an outdated Safe Area peer range. The
combination is verified by Android and iOS builds on React Native 0.72.3.

The postinstall script updates the unavailable React Native 0.72 Boost download
URL. Do not remove it unless React Native is upgraded past the affected version.

## Validate

```shell
yarn test --runInBand --no-watchman
yarn lint

cd android
./gradlew app:assembleDebug app:assembleRelease
```

Android APKs are written under `android/app/build/outputs/apk/`. For iOS, open
`ios/StringeeChatSample.xcworkspace` after running `pod install`.

## Implementation notes

`src/StringeeClient.js` preserves the callback-oriented API used by the original
sample and delegates each operation to the v2 listener and Promise APIs. New
application code may use `StringeeClient`, `Conversation`, and the other v2 SDK
classes directly.
