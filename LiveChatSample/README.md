# LiveChatSample

React Native `0.72.3` sample for Stringee Live Chat using
`stringee-react-native-v2`. The Customer and Agent flows are available as two
tabs in the same application.

## Requirements

- Node.js 16 or newer and Yarn 1.x
- JDK 17 and Android SDK 33 or newer
- Xcode and CocoaPods for iOS; iOS 15 or later (Stringee iOS SDK `2.2.0`, referenced
  by podspec in `ios/Podfile`)
- A Stringee project with Live Chat enabled

## Configure

Replace the development placeholders before running the related flow:

- `YOUR_WIDGET_KEY` in `src/Customer.js` for the Customer flow.
- `YOUR_ACCESS_TOKEN` in `src/Agent.js` for the Agent flow.

Generate access tokens on a trusted server. Never place a Stringee API secret
inside the application.

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
`ios/LiveChatSample.xcworkspace` after running `pod install`.

## Implementation notes

`src/StringeeClient.js` is a compatibility component. It maps the original
callback-oriented sample surface to the listener and Promise APIs provided by
`stringee-react-native-v2`. New application code may use the v2 SDK classes
directly instead.
