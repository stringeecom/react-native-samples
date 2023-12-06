import React, {Component, createRef} from 'react';
import ActionSheet from 'react-native-actions-sheet';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import {UserInfo} from 'stringee-react-native-v2';

export default class ActShtUpdateUserInfo extends Component {
  constructor(props) {
    super(props);

    this.ref = createRef();
    this.state = {
      name: '',
      email: '',
      avatar: '',
      phone: '',
      location: '',
      browser: '',
      platform: '',
      device: '',
      ipAddress: '',
      hostName: '',
      userAgent: '',
    };
  }

  show = () => {
    this.ref.current.show();
  };

  hide = () => {
    this.ref.current.hide();
  };

  setUserInfo = user => {
    this.setState({
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      location: user.location,
      browser: user.browser,
      platform: user.platform,
      device: user.device,
      ipAddress: user.ipAddress,
      hostName: user.hostName,
      userAgent: user.userAgent,
    });
  };

  render(): React.ReactNode {
    return (
      <ActionSheet
        containerStyle={this.styles.container}
        ref={this.ref}
        bounceOnOpen={true}
        defaultOverlayOpacity={0.3}>
        <SafeAreaView>
          <ScrollView>
            <Text style={this.styles.title}>Name: </Text>
            <TextInput
              style={this.styles.input}
              value={this.state.name}
              placeholder="Name"
              onChangeText={text => {
                this.setState({
                  name: text,
                });
              }}
            />

            <Text style={this.styles.title}>Email: </Text>
            <TextInput
              style={this.styles.input}
              value={this.state.email}
              placeholder="Email"
              onChangeText={text => {
                this.setState({
                  email: text,
                });
              }}
            />

            <Text style={this.styles.title}>Avatar: </Text>
            <TextInput
              style={this.styles.input}
              value={this.state.avatar}
              placeholder="Avatar"
              onChangeText={text => {
                this.setState({
                  avatar: text,
                });
              }}
            />

            <Text style={this.styles.title}>Phone: </Text>
            <TextInput
              style={this.styles.input}
              value={this.state.phone}
              placeholder="Phone"
              onChangeText={text => {
                this.setState({
                  phone: text,
                });
              }}
            />

            <Text style={this.styles.title}>Location: </Text>
            <TextInput
              style={this.styles.input}
              value={this.state.location}
              placeholder="Location"
              onChangeText={text => {
                this.setState({
                  location: text,
                });
              }}
            />

            <Text style={this.styles.title}>Browser: </Text>
            <TextInput
              style={this.styles.input}
              value={this.state.browser}
              placeholder="Browser"
              onChangeText={text => {
                this.setState({
                  browser: text,
                });
              }}
            />

            <Text style={this.styles.title}>Platform: </Text>
            <TextInput
              style={this.styles.input}
              value={this.state.platform}
              placeholder="Platform"
              onChangeText={text => {
                this.setState({
                  platform: text,
                });
              }}
            />

            <Text style={this.styles.title}>Device: </Text>
            <TextInput
              style={this.styles.input}
              value={this.state.device}
              placeholder="Device"
              onChangeText={text => {
                this.setState({
                  device: text,
                });
              }}
            />

            <Text style={this.styles.title}>Ip address: </Text>
            <TextInput
              style={this.styles.input}
              value={this.state.ipAddress}
              placeholder="Ip address"
              onChangeText={text => {
                this.setState({
                  ipAddress: text,
                });
              }}
            />

            <Text style={this.styles.title}>Host name: </Text>
            <TextInput
              style={this.styles.input}
              value={this.state.hostName}
              placeholder="Host name"
              onChangeText={text => {
                this.setState({
                  hostName: text,
                });
              }}
            />

            <Text style={this.styles.title}>User agent: </Text>
            <TextInput
              style={this.styles.input}
              value={this.state.userAgent}
              placeholder="User agent"
              onChangeText={text => {
                this.setState({
                  userAgent: text,
                });
              }}
            />

            <View style={this.styles.rowButton}>
              <TouchableOpacity
                style={this.styles.button}
                onPress={() => {
                  if (this.state.name.trim() === '') {
                    Alert.alert('name is empty');
                    return;
                  }
                  this.hide();
                  let userInfo: UserInfo = new UserInfo();
                  userInfo.name = this.state.name;
                  userInfo.email = this.state.email;
                  userInfo.avatar = this.state.avatar;
                  userInfo.phone = this.state.phone;
                  userInfo.location = this.state.location;
                  userInfo.browser = this.state.browser;
                  userInfo.platform = this.state.platform;
                  userInfo.device = this.state.device;
                  userInfo.ipAddress = this.state.ipAddress;
                  userInfo.hostName = this.state.hostName;
                  userInfo.userAgent = this.state.userAgent;
                  this.props.data(userInfo);
                }}>
                <Text style={this.styles.text}>Update</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ActionSheet>
    );
  }
  styles = StyleSheet.create({
    container: {
      marginBottom: 10,
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      height: 500,
    },
    input: {
      height: 40,
      borderWidth: 1,
      marginHorizontal: 10,
      padding: 10,
    },
    row: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 16,
      textAlign: 'left',
      margin: 10,
      fontWeight: 'bold',
    },
    text: {
      textAlign: 'center',
      color: '#F5FCFF',
      fontWeight: 'bold',
      fontSize: 15,
    },
    rowButton: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
    },
    button: {
      margin: 10,
      paddingVertical: 10,
      paddingHorizontal: 5,
      width: '45%',
      justifyContent: 'center',
      backgroundColor: '#1E6738',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#fff',
    },
  });
}
