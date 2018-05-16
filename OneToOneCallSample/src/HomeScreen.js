import React, { Component } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  TouchableOpacity,
  Keyboard,
  AsyncStorage
} from "react-native";
import { StringeeClient } from "stringee-react-native";
import FCM from "react-native-fcm";
import { FCMEvent } from "react-native-fcm";

const user1 =
  "eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTS0xIb2NCdDl6Qk5qc1pLeThZaUVkSzRsU3NBZjhCSHpyLTE1MjY0Mzk4MzYiLCJpc3MiOiJTS0xIb2NCdDl6Qk5qc1pLeThZaUVkSzRsU3NBZjhCSHpyIiwiZXhwIjoxNTI5MDMxODM2LCJ1c2VySWQiOiJ1c2VyMSJ9.b3SyresP13tRRqpDKsrICTL_pgy1cZhWhLzWOmcHOqE";
const user2 =
  "eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTS0xIb2NCdDl6Qk5qc1pLeThZaUVkSzRsU3NBZjhCSHpyLTE1MjY0Mzk4NjciLCJpc3MiOiJTS0xIb2NCdDl6Qk5qc1pLeThZaUVkSzRsU3NBZjhCSHpyIiwiZXhwIjoxNTI5MDMxODY3LCJ1c2VySWQiOiJ1c2VyMiJ9.ToDDjZd61zLb2Cez-a5e8xu6JKcLQv4Aky1fyYl0rNo";

const iOS = Platform.OS === "ios" ? true : false;

export default class HomeScreen extends Component {
  constructor(props) {
    super(props);

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
  }

  componentWillMount() {}

  async componentDidMount() {
    await this.refs.client.connect(user1);
  }

  // Connection
  _clientDidConnect = ({ userId }) => {
    console.log("_clientDidConnect - " + userId);
    this.setState({ myUserId: userId, hasConnected: true });

    if (!iOS) {
      AsyncStorage.getItem("isPushTokenRegistered").then(value => {
        if (value !== "true") {
          FCM.getFCMToken().then(token => {
            this.refs.client.registerPush(
              token,
              true,
              true,
              (result, code, desc) => {
                if (result) {
                  AsyncStorage.multiSet([
                    ["isPushTokenRegistered", "true"],
                    ["token", token]
                  ]);
                }
              }
            );
          });
        }
      });

      FCM.on(FCMEvent.RefreshToken, token => {
        this.refs.client.registerPush(
          token,
          true,
          true,
          (result, code, desc) => {}
        );
      });
    }
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
    console.log("_onVoiceCallButtonPress");
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
    console.log("_onVideoCallButtonPress");
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
