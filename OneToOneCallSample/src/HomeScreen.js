import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  TouchableOpacity
} from "react-native";

import {
  StringeeClient
} from "stringee-react-native";

const user1 = "eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTS0xIb2NCdDl6Qk5qc1pLeThZaUVkSzRsU3NBZjhCSHpyLTE1MjM4NTQ2MTkiLCJpc3MiOiJTS0xIb2NCdDl6Qk5qc1pLeThZaUVkSzRsU3NBZjhCSHpyIiwiZXhwIjoxNTI2NDQ2NjE5LCJ1c2VySWQiOiJ1c2VyMSJ9.VU8Bm538J2F8r1bGXdm1DAPTu_y5NCp_TNYCrnKjsyw";
const user2 = "eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTS0xIb2NCdDl6Qk5qc1pLeThZaUVkSzRsU3NBZjhCSHpyLTE1MjM4NTQ2MzUiLCJpc3MiOiJTS0xIb2NCdDl6Qk5qc1pLeThZaUVkSzRsU3NBZjhCSHpyIiwiZXhwIjoxNTI2NDQ2NjM1LCJ1c2VySWQiOiJ1c2VyMiJ9.4S1nqzeITAUKlhXJwvPB-BcNQoHSPtPvyXFaM2s9JsE";

const iOS = Platform.OS === 'ios' ? true : false;

export default class HomeScreen extends Component {

  constructor(props) {
    super(props);

    this.state = {
      myUserId:'',
      callToUserId:'',
      hasConnected:false
    }

    this.clientEventHandlers = {
      onConnect: this._clientDidConnect,
      onDisConnect: this._clientDidDisConnect,
      onFailWithError: this._clientDidFailWithError,
      onRequestAccessToken: this._clientRequestAccessToken,
      onIncomingCall: this._callIncomingCall,
    };
  }

  componentWillMount() { 

  }

  async componentDidMount() {
    await this.refs.client.connect(user1);
  }

  // Connection
  _clientDidConnect = ({userId}) => {
    console.log('_clientDidConnect - ' + userId);
    this.setState({myUserId:userId, hasConnected:true});
  }

  _clientDidDisConnect = () => {
    console.log('_clientDidDisConnect');
    this.setState({myUserId:'', hasConnected:false});
  }

  _clientDidFailWithError = () => {
    console.log('_clientDidFailWithError');
  }

  _clientRequestAccessToken = () => {
    console.log("_clientRequestAccessToken");
  }

   // Call events
  _callIncomingCall = ({callId, from, to, fromAlias, toAlias, callType, isVideoCall}) => {
    console.log("IncomingCallId-" + callId + ' from-' + from + ' to-' + to + ' fromAlias-' + fromAlias + ' toAlias-' + toAlias + ' isVideoCall-' + isVideoCall + 'callType-' + callType);

    this.props.navigation.navigate('Call', {callId: callId , from:from, to: to, isOutgoingCall:false, isVideoCall:isVideoCall})
  }

  // Action
  _onVoiceCallButtonPress = () => {
    console.log("_onVoiceCallButtonPress");
    if (this.state.callToUserId != '' && this.state.hasConnected) {
      this.props.navigation.navigate('Call', {from: this.state.myUserId, to:this.state.callToUserId, isOutgoingCall:true, isVideoCall:false})
    }
  }

  _onVideoCallButtonPress = () => {
    console.log("_onVideoCallButtonPress");
    if (this.state.callToUserId != '' && this.state.hasConnected) {
      this.props.navigation.navigate('Call', {from: this.state.myUserId, to:this.state.callToUserId, isOutgoingCall:true, isVideoCall:true})
    }
  }

  render () {
    return (
      <View style={styles.container}>

        <Text style={styles.welcome}>
          Welcome to the React Native of Stringee!
        </Text>

        <Text style={styles.info}>
          {this.state.myUserId}
        </Text>

        <TextInput style={styles.input} autoCapitalize="none" value={this.state.callToUserId} placeholder='Call to userId' onChangeText={text => this.setState(
          { callToUserId: text }
        )}/>

        <View style={styles.buttonView}>
          <TouchableOpacity style={styles.button} onPress={this._onVoiceCallButtonPress}>
            <Text style={styles.text}>Voice Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={this._onVideoCallButtonPress}>
            <Text style={styles.text}>Video Call</Text>
          </TouchableOpacity>

        </View>

        <StringeeClient
          ref="client"
          eventHandlers = {this.clientEventHandlers}
         /> 

      </View>
    )
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
      fontWeight: 'bold'
    },
    info: {
      fontSize: 20,
      textAlign: "center",
      margin: 10,
      fontWeight: 'bold',
      color: 'red'
    },
  
    text: {
      textAlign: "center",
      color: "#F5FCFF",
      marginBottom: 5,
      fontWeight: 'bold',
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
      marginTop: 40,
      // marginBottom: 70,
      paddingTop: 10,
      paddingBottom: 10,
      backgroundColor: "#1E6738",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#fff"
    },

    buttonView: {
      width: 280,
      height: 80,
      flexDirection: 'row',
      justifyContent: 'space-between'
    }
  });
  