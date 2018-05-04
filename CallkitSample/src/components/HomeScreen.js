import React, { Component } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  TouchableOpacity,
  Keyboard
} from "react-native";

import { StringeeClient } from "stringee-react-native";

import VoipPushNotification from "react-native-voip-push-notification";

import RNCallKit from "react-native-callkit";

const yourUser = "YOUR_USER_ACCESS_TOKEN";

const iOS = Platform.OS === "ios" ? true : false;

export default class HomeScreen extends Component {
  constructor(props) {
    super(props);
    console.log("$$$$$$$$ HOME CONSTRUCTOR");

    this.state = {
      myUserId: "",
      callToUserId: "",
      hasConnected: false
    };

    this.clientEventHandlers = {
      onConnect: this._clientDidConnect,
      onDisConnect: this._clientDidDisConnect,
      onFailWithError: this._clientDidFailWithError,
      onRequestAccessToken: this._clientRequestAccessToken,
      onIncomingCall: this._callIncomingCall
    };

    // Initialise RNCallKit
    let options = {
      appName: "RNCallKitExample",
      imageName: "my_image_name_in_bundle",
      ringtoneSound: "my_ringtone_sound_filename_in_bundle"
    };
    try {
      // Chú ý khi cấu hình hàm này cần gọi 1 lần duy nhất.
      RNCallKit.setup(options);
    } catch (err) {
      console.log("error:", err.message);
    }
  }

  async componentDidMount() {
    await this.refs.client.connect(yourUser);

    VoipPushNotification.requestPermissions();

    VoipPushNotification.addEventListener("register", token => {
      // send token to your apn provider server
      this.refs.client.registerPush(
        token,
        false, // isProduction: false trong quá trình development, true khi build release.
        true, // (iOS) isVoip: true nếu là kiểu Voip PushNotification. Hiện Stringee đang hỗ trợ kiểu này.
        (status, code, message) => {
          console.log(message);
        }
      );
    });

    VoipPushNotification.addEventListener("notification", notification => {
      /**
       * Local Notification Payload
       *
       * - `alertBody` : The message displayed in the notification alert.
       * - `alertAction` : The "action" displayed beneath an actionable notification. Defaults to "view";
       * - `soundName` : The sound played when the notification is fired (optional).
       * - `category`  : The category of this notification, required for actionable notifications (optional).
       * - `userInfo`  : An optional object containing additional notification data.
       */
      // VoipPushNotification.presentLocalNotification({
      //   alertBody: "hello! " + notification.getMessage()
      // });
    });
  }

  // Connection
  _clientDidConnect = ({ userId }) => {
    console.log("_clientDidConnect - " + userId);
    this.setState({ myUserId: userId, hasConnected: true });
  };

  _clientDidDisConnect = () => {
    console.log("_clientDidDisConnect");
    this.setState({ myUserId: "", hasConnected: false });
  };

  _clientDidFailWithError = () => {
    console.log("_clientDidFailWithError");
  };

  _clientRequestAccessToken = () => {
    console.log("_clientRequestAccessToken");
  };

  // Call events
  _callIncomingCall = ({
    callId,
    from,
    to,
    fromAlias,
    toAlias,
    callType,
    isVideoCall
  }) => {
    console.log(
      "IncomingCallId-" +
        callId +
        " from-" +
        from +
        " to-" +
        to +
        " fromAlias-" +
        fromAlias +
        " toAlias-" +
        toAlias +
        " isVideoCall-" +
        isVideoCall +
        "callType-" +
        callType
    );

    this.props.navigation.navigate("Call", {
      callId: callId,
      from: from,
      to: to,
      isOutgoingCall: false,
      isVideoCall: isVideoCall
    });
  };

  // Action
  _onVoiceCallButtonPress = () => {
    Keyboard.dismiss();
    if (this.state.callToUserId != "" && this.state.hasConnected) {
      this.props.navigation.navigate("Call", {
        from: this.state.myUserId,
        to: this.state.callToUserId,
        isOutgoingCall: true,
        isVideoCall: false
      });
    }
  };

  _onVideoCallButtonPress = () => {
    Keyboard.dismiss();
    if (this.state.callToUserId != "" && this.state.hasConnected) {
      this.props.navigation.navigate("Call", {
        from: this.state.myUserId,
        to: this.state.callToUserId,
        isOutgoingCall: true,
        isVideoCall: true
      });
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          React Native wrapper for Stringee mobile SDK!
        </Text>

        <Text style={styles.info}>Logged in as: {this.state.myUserId}</Text>

        <TextInput
          underlineColorAndroid="transparent"
          style={styles.input}
          autoCapitalize="none"
          value={this.state.callToUserId}
          placeholder="Make a call to userId"
          onChangeText={text => this.setState({ callToUserId: text })}
        />

        <View style={styles.buttonView}>
          <TouchableOpacity
            style={styles.button}
            onPress={this._onVoiceCallButtonPress}
          >
            <Text style={styles.text}>Voice Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={this._onVideoCallButtonPress}
          >
            <Text style={styles.text}>Video Call</Text>
          </TouchableOpacity>
        </View>

        <StringeeClient ref="client" eventHandlers={this.clientEventHandlers} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10,
    fontWeight: "bold"
  },
  info: {
    fontSize: 20,
    textAlign: "center",
    margin: 10,
    fontWeight: "bold",
    color: "red"
  },

  text: {
    textAlign: "center",
    color: "#F5FCFF",
    marginBottom: 5,
    fontWeight: "bold",
    fontSize: 15
  },

  input: {
    height: 35,
    width: 280,
    borderWidth: 1,
    borderRadius: 5,
    marginTop: 20,
    textAlign: "center",
    backgroundColor: "#ECECEC"
  },

  button: {
    width: 120,
    height: 40,
    marginTop: 40,
    paddingTop: 10,
    // paddingBottom: ,
    backgroundColor: "#1E6738",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fff"
  },

  buttonView: {
    width: 280,
    height: 80,
    flexDirection: "row",
    justifyContent: "space-between"
  }
});
