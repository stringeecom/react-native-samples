import React, {Component} from 'react';
import {
  PermissionsAndroid,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {StringeeClient} from 'stringee-react-native';

export default class HomeScreen extends Component {
  token: string = 'PUT_YOUR_TOKEN_HERE';
  roomToken: string = 'PUT_YOUR_ROOM_TOKEN_HERE';

  constructor(props) {
    super(props);
    this.state = {
      userId: '',
      connected: false,
      clientId: '',
      permissionGranted: false,
      userName: '',
    };
    this.client = React.createRef();
    this.clientEventHandlers = {
      onConnect: this.clientDidConnect,
      onDisConnect: this.clientDidDisConnect,
      onFailWithError: this.clientDidFailWithError,
      onRequestAccessToken: this.clientRequestAccessToken,
      onCustomMessage: this.clientReceiveCustomMessage,
    };
  }

  componentDidMount() {
    if (!this.state.permissionGranted) {
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

    this.client.current.connect(this.token);
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
    this.setState({
      userId: 'Disconnected',
      connected: false,
    });
  };

  // The client fails to connects to Stringee server
  clientDidFailWithError = ({code, message}) => {
    console.log(
      'clientDidFailWithError: code-' + code + ' message: ' + message,
    );
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
      <SafeAreaView style={this.styles.container}>
        <Text style={this.styles.info}>Logged in as: {this.state.userId}</Text>

        <View style={this.styles.center}>
          <TouchableOpacity
            style={this.styles.button}
            onPress={() => {
              if (this.state.connected) {
                if (this.state.permissionGranted) {
                  this.props.navigation.navigate('Room', {
                    clientId: this.client.current.getId(),
                    roomToken: this.roomToken,
                  });
                } else {
                  console.log('Need require permission');
                }
              } else {
                console.log('StringeeClient is disconnected');
              }
            }}>
            <Text style={this.styles.text}>Join room</Text>
          </TouchableOpacity>
        </View>

        <StringeeClient
          ref={this.client}
          eventHandlers={this.clientEventHandlers}
        />
      </SafeAreaView>
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
    text: {
      textAlign: 'center',
      color: '#F5FCFF',
      fontWeight: 'bold',
      fontSize: 15,
    },
    input: {
      width: '80%',
      marginBottom: 20,
      backgroundColor: '#fff',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 15,
      fontSize: 16,
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
