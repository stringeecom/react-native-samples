import React, {Component} from 'react';
import {
  PermissionsAndroid,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform
} from 'react-native';
import {StringeeClient} from 'stringee-react-native';

export default class HomeScreen extends Component {
  token1: string = 'eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTS0xiT0Rpa3o4ZHBITGRvVU92c0lJYWdCTFZqUXNJOXdKLTE2NDc0MTM5NDQiLCJpc3MiOiJTS0xiT0Rpa3o4ZHBITGRvVU92c0lJYWdCTFZqUXNJOXdKIiwiZXhwIjoxNjUwMDA1OTQ0LCJ1c2VySWQiOiJ1c2VyMSJ9._C164Z0_9y4LwrA0fJIgyGpoWpTjn4Df-COsuPBs4c8';
  token2: string = 'eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTS0xiT0Rpa3o4ZHBITGRvVU92c0lJYWdCTFZqUXNJOXdKLTE2NDc0MTM5NTIiLCJpc3MiOiJTS0xiT0Rpa3o4ZHBITGRvVU92c0lJYWdCTFZqUXNJOXdKIiwiZXhwIjoxNjUwMDA1OTUyLCJ1c2VySWQiOiJ1c2VyMiJ9.JVsrsFd9n_KqzzJGEQYyjfDt7mTV5ei0-o4YB_w2ojs';

  // token: string = user1;

  constructor(props) {
    super(props);
    this.state = {
      userId: '',
      to: '',
      connected: false,
      clientId: '',
      permissionGranted: false,
    };
    this.client = React.createRef();
    this.clientEventHandlers = {
      onConnect: this.clientDidConnect,
      onDisConnect: this.clientDidDisConnect,
      onFailWithError: this.clientDidFailWithError,
      onIncomingCall: this.clientDidIncomingCall,
      onIncomingCall2: this.clientDidIncomingCall2,
      onRequestAccessToken: this.clientRequestAccessToken,
      onCustomMessage: this.clientReceiveCustomMessage,
    };
  }

  componentDidMount() {
    if (!this.state.permissionGranted) {
      if (Platform.OS === 'android') {
        this.requestPermission();
      }
    }

    this.client.current.connect(this.token2);
  }

  requestPermission() {
    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]).then(result => {
      if (
        result['android.permission.CAMERA'] &&
        result['android.permission.RECORD_AUDIO'] === 'granted'
      ) {
        this.setState({
          permissionGranted: true,
        });
      }
    });
  }

  makeCall(isCall: boolean, isVideoCall: boolean) {
    if (this.state.permissionGranted || Platform.OS === 'ios') {
      if (this.state.to.trim() !== '') {
        if (isCall) {
          this.props.navigation.navigate('Call', {
            callId: '',
            clientId: this.client.current.getId(),
            isVideoCall: isVideoCall,
            from: this.state.userId,
            to: this.state.to,
            isIncoming: false,
          });
        } else {
          this.props.navigation.navigate('Call2', {
            callId: '',
            clientId: this.client.current.getId(),
            isVideoCall: isVideoCall,
            from: this.state.userId,
            to: this.state.to,
            isIncoming: false,
          });
        }
      }
    } else {
      console.log('Need require permission');
    }
  }

  //Event
  // The client connects to Stringee server
  clientDidConnect = ({userId}) => {
    console.log('clientDidConnect - ' + userId);
    this.setState({
      userId: userId,
      connected: true,
    });
  };

  // The client disconnects from Stringee server
  clientDidDisConnect = () => {
    console.log('clientDidDisConnect');
    this.client.current.disconnect();
    this.setState({
      userId: 'Disconnected',
      hasConnected: false,
    });
  };

  // The client fails to connects to Stringee server
  clientDidFailWithError = ({code, message}) => {
    console.log(
      'clientDidFailWithError: code-' + code + ' message: ' + message,
    );
  };

  // IncomingCall event
  clientDidIncomingCall = ({
    callId,
    from,
    to,
    fromAlias,
    toAlias,
    callType,
    isVideoCall,
    customDataFromYourServer,
  }) => {
    console.log(
      'clientDidIncomingCall-' +
        callId +
        ' from-' +
        from +
        ' to-' +
        to +
        ' fromAlias-' +
        fromAlias +
        ' toAlias-' +
        toAlias +
        ' isVideoCall-' +
        isVideoCall +
        'callType-' +
        callType +
        'customDataFromYourServer-' +
        customDataFromYourServer,
    );

    this.props.navigation.navigate('Call', {
      callId: callId,
      clientId: this.client.current.getId(),
      isVideoCall: isVideoCall,
      from: from,
      to: this.state.userId,
      isIncoming: true,
    });
  };

  // IncomingCall2 event
  clientDidIncomingCall2 = ({
    callId,
    from,
    to,
    fromAlias,
    toAlias,
    callType,
    isVideoCall,
    customDataFromYourServer,
  }) => {
    console.log(
      'clientDidIncomingCall2-' +
        callId +
        ' from-' +
        from +
        ' to-' +
        to +
        ' fromAlias-' +
        fromAlias +
        ' toAlias-' +
        toAlias +
        ' isVideoCall-' +
        isVideoCall +
        'callType-' +
        callType +
        'customDataFromYourServer-' +
        customDataFromYourServer,
    );

    this.props.navigation.navigate('Call2', {
      callId: callId,
      clientId: this.client.current.getId(),
      isVideoCall: isVideoCall,
      from: from,
      to: this.state.userId,
      isIncoming: true,
    });
  };

  // Access token is expired. A new access token is required to connect to Stringee server
  clientRequestAccessToken = () => {
    console.log('clientRequestAccessToken');
    // Token để kết nối tới Stringee server đã hết bạn. Bạn cần lấy token mới và gọi connect lại ở đây
  };

  // Receive custom message
  clientReceiveCustomMessage = ({data}) => {
    console.log('_clientReceiveCustomMessage: ' + data);
  };

  render(): React.ReactNode {
    return (
      <View style={this.styles.container}>
        <View style={this.styles.center}>
          <Text style={this.styles.info}>
            Logged in as: {this.state.userId}
          </Text>
          <TextInput
            style={this.styles.input}
            onChangeText={text => {
              this.setState({to: text});
            }}
            placeholder={'To'}
          />
          <View style={this.styles.rowBtn}>
            <TouchableOpacity
              style={this.styles.button}
              onPress={() => {
                this.makeCall(true, false);
              }}>
              <Text style={this.styles.text}>Voice call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={this.styles.button}
              onPress={() => {
                this.makeCall(false, false);
              }}>
              <Text style={this.styles.text}>Voice call2</Text>
            </TouchableOpacity>
          </View>
          <View style={this.styles.rowBtn}>
            <TouchableOpacity
              style={this.styles.button}
              onPress={() => {
                this.makeCall(true, true);
              }}>
              <Text style={this.styles.text}>Video call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={this.styles.button}
              onPress={() => {
                this.makeCall(false, true);
              }}>
              <Text style={this.styles.text}>Video call2</Text>
            </TouchableOpacity>
          </View>
        </View>

        <StringeeClient
          ref={this.client}
          eventHandlers={this.clientEventHandlers}
        />
      </View>
    );
  }

  styles = StyleSheet.create({
    container: {
      flexDirection: 'column',
    },
    center: {
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    info: {
      fontSize: 20,
      textAlign: 'center',
      margin: 10,
      fontWeight: 'bold',
      color: 'red',
    },
    rowBtn: {
      marginTop: 20,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
    },
    input: {
      width: '80%',
      backgroundColor: '#fff',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 15,
      fontSize: 16,
    },
    text: {
      textAlign: 'center',
      color: '#F5FCFF',
      fontWeight: 'bold',
      fontSize: 15,
    },
    button: {
      width: 120,
      height: 40,
      justifyContent: 'center',
      backgroundColor: '#1E6738',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#fff',
    },
  });
}
