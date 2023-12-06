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

# Learn More

To learn more about `stringee-react-native-v2`, take a look at the following resources:

- [stringee-react-native-v2](https://www.npmjs.com/package/stringee-react-native-v2) - **stringee-react-native-v2 module** in npm.
- [Overview](https://developer.stringee.com/docs/call-api-overview) - an **overview** of call API from Stringee.
- [Getting Started with StringeeCall](https://asia-1.console.stringee.com/docs/getting-started-stringee-react-native-sdk) - a **Getting started document** of stringee-react-native-v2 module and how create a call project with StringeeCall.
- [Getting Started with StringeeCall2](https://asia-1.console.stringee.com/docs/getting-started-stringee-react-native-sdk2) - a **Getting started document** of stringee-react-native-v2 module and how create a call project with StringeeCall2.
- [API Reference](https://developer.stringee.com/docs/react-native-api-reference) - Specific details about the objects are in stringee-react-native-v2.
