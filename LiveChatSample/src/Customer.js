import React, {Component, createRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import {StringeeClient, Conversation} from 'stringee-react-native';

const widgetKey = 'YOUR_WIDGET_KEY';
var _conversation: Conversation;

export default class Customer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userId: '',
      connected: false,
      inConv: false,
      clientId: '',
      log: [],
    };
    this.client = createRef();
    this.clientEventHandlers = {
      onConnect: this.onConnect,
      onDisConnect: this.onDisConnect,
      onFailWithError: this.onFailWithError,
      onRequestAccessToken: this.onRequestAccessToken,
      onCustomMessage: this.onCustomMessage,
      onObjectChange: this.onObjectChange,
      onTimeoutInQueue: this.onTimeoutInQueue,
      onConversationEnded: this.onConversationEnded,
      onUserBeginTyping: this.onUserBeginTyping,
      onUserEndTyping: this.onUserEndTyping,
    };
  }

  componentDidMount(): void {
    // Get chat profile
    this.client.current.getChatProfile(
      widgetKey,
      (status, code, message, chatProfile) => {
        console.log(
          'getChatProfile, msg: ' +
            message +
            ' Profile: ' +
            JSON.stringify(chatProfile),
        );
        if (chatProfile != null) {
          this.state.log.push({
            data: 'getChatProfile - ' + JSON.stringify(chatProfile),
          });
          this.setState({
            queueId: chatProfile.queues[1].id,
          });
        }
      },
    );
  }

  //Event
  // The client connects to Stringee server
  onConnect = ({userId}) => {
    console.log('onConnect - ' + userId);
    this.state.log.push({
      data: 'onConnect - ' + userId,
    });
    this.setState({
      userId: userId,
      connected: true,
    });
  };

  // The client disconnects from Stringee server
  onDisConnect = () => {
    console.log('onDisConnect');
    this.state.log.push({
      data: 'onDisConnect',
    });
    this.client.current.disconnect();
    this.setState({
      userId: 'Disconnected',
      connected: false,
    });
  };

  // The client fails to connects to Stringee server
  onFailWithError = ({code, message}) => {
    console.log('onFailWithError: code-' + code + ' message: ' + message);
    this.state.log.push({
      data: 'onFailWithError: code-' + code + ' message: ' + message,
      connected: false,
    });
  };

  // Access token is expired. A new access token is required to connect to Stringee server
  onRequestAccessToken = () => {
    console.log('onRequestAccessToken');
    this.state.log.push({
      data: 'onRequestAccessToken',
      connected: false,
    });
    // Token để kết nối tới Stringee server đã hết bạn. Bạn cần lấy token mới và gọi connect lại ở đây
    // this.client.current.connect('NEW_TOKEN');
  };

  // Receive custom message
  onCustomMessage = ({data}) => {
    console.log('onCustomMessage: ' + data);
    this.state.log.push({
      data: 'onCustomMessage: ' + data,
    });
  };

  // Receive event of Conversation or Message
  onObjectChange = ({objectType, objectChanges, changeType}) => {
    console.log(
      'onObjectChange: objectType - ' +
        objectType +
        '\n changeType - ' +
        changeType +
        '\n objectChanges - ' +
        JSON.stringify(objectChanges),
    );
    this.state.log.push({
      data:
        'onObjectChange: objectType - ' +
        objectType +
        '\n changeType - ' +
        changeType +
        '\n objectChanges - ' +
        JSON.stringify(objectChanges),
    });
  };

  // Receive when chat request to queue is timeout
  onTimeoutInQueue = ({convId, customerId, customerName}) => {
    console.log(
      'onTimeoutInQueue: convId - ' +
        convId +
        '\n customerId - ' +
        customerId +
        '\n customerName - ' +
        customerName,
    );
    this.state.log.push({
      data:
        'onTimeoutInQueue: convId - ' +
        convId +
        '\n customerId - ' +
        customerId +
        '\n customerName - ' +
        customerName,
    });
    this.setState({
      inConv: false,
    });
  };

  // Receive when conversation ended
  onConversationEnded = ({convId, endedby}) => {
    console.log(
      'onConversationEnded: convId - ' + convId + '\n endedby - ' + endedby,
    );
    this.state.log.push({
      data:
        'onConversationEnded: convId - ' + convId + '\n endedby - ' + endedby,
    });
    this.setState({
      inConv: false,
    });
  };

  // Receive when user send beginTyping
  onUserBeginTyping = ({convId, userId, displayName}) => {
    console.log(
      'onUserBeginTyping: convId - ' +
        convId +
        '\n userId - ' +
        userId +
        '\n displayName - ' +
        displayName,
    );
    this.state.log.push({
      data:
        'onUserBeginTyping: convId - ' +
        convId +
        '\n userId - ' +
        userId +
        '\n displayName - ' +
        displayName,
    });
  };

  // Receive when user send endTyping
  onUserEndTyping = ({convId, userId, displayName}) => {
    console.log(
      'onUserEndTyping: convId - ' +
        convId +
        '\n userId - ' +
        userId +
        '\n displayName - ' +
        displayName,
    );
    this.state.log.push({
      data:
        'onUserEndTyping: convId - ' +
        convId +
        '\n userId - ' +
        userId +
        '\n displayName - ' +
        displayName,
    });
  };

  viewConnect = () => {
    return (
      <View style={this.styles.container}>
        <TextInput
          underlineColorAndroid="transparent"
          style={this.styles.input}
          autoCapitalize="none"
          value={this.state.name}
          placeholder="Name"
          onChangeText={text => this.setState({name: text})}
        />
        <TextInput
          underlineColorAndroid="transparent"
          style={this.styles.input}
          autoCapitalize="none"
          value={this.state.email}
          placeholder="Email"
          onChangeText={text => this.setState({email: text})}
        />

        <TouchableOpacity
          style={this.styles.button}
          onPress={() => {
            // Get live chat token
            this.client.current.getLiveChatToken(
              widgetKey,
              this.state.name,
              this.state.email,
              (status, code, message, token) => {
                console.log('getLiveChatToken: ' + JSON.stringify(token));
                this.state.log.push({
                  data: 'getLiveChatToken - ' + JSON.stringify(token),
                });
                this.client.current.connect(token);
              },
            );
          }}>
          <Text style={this.styles.text}>Connect</Text>
        </TouchableOpacity>
      </View>
    );
  };

  btnStartLiveChat = () => {
    return (
      <View style={this.styles.container}>
        <TouchableOpacity
          style={this.styles.button}
          onPress={() => {
            this.client.current.createLiveChatConversation(
              this.state.queueId,
              (status, code, message, conversation) => {
                _conversation = conversation;
                console.log(
                  'createLiveChatConversation - ' +
                    JSON.stringify(_conversation),
                );
                this.state.log.push({
                  data:
                    'createLiveChatConversation - ' +
                    JSON.stringify(_conversation),
                });
                this.setState({
                  inConv: true,
                });
              },
            );
          }}>
          <Text style={this.styles.text}>Create live-chat</Text>
        </TouchableOpacity>
      </View>
    );
  };

  viewInConv = () => {
    return (
      <View style={this.styles.container}>
        <View style={this.styles.rowButton}>
          <TouchableOpacity
            style={this.styles.button}
            onPress={() => {
              const message = {
                message: {
                  content: 'Test',
                },
                type: 1,
                convId: _conversation.id,
              };

              this.client.current.sendMessage(
                message,
                (status, code, message) => {
                  console.log(
                    'sendMessage: status - ' +
                      status +
                      ' code - ' +
                      code +
                      ' message - ' +
                      message,
                  );
                  this.state.log.push({
                    data:
                      'sendMessage: status - ' +
                      status +
                      ' code - ' +
                      code +
                      ' message - ' +
                      message,
                  });
                },
              );
            }}>
            <Text style={this.styles.text}>Send message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={this.styles.button}
            onPress={() => {
              this.client.current.endChat(
                _conversation.id,
                (status, code, message) => {
                  console.log(
                    'endChat: status - ' +
                      status +
                      ' code - ' +
                      code +
                      ' message - ' +
                      message,
                  );
                  this.state.log.push({
                    data:
                      'endChat: status - ' +
                      status +
                      ' code - ' +
                      code +
                      ' message - ' +
                      message,
                  });
                  this.setState({
                    inConv: false,
                  });
                },
              );
            }}>
            <Text style={this.styles.text}>End chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  render(): React.ReactNode {
    return (
      <View style={this.styles.container}>
        <Text style={this.styles.info}>Logged in as: {this.state.userId}</Text>

        <View style={this.styles.box}>
          <FlatList
            style={this.styles.list}
            data={this.state.log}
            renderItem={({item}) => (
              <View style={this.styles.item}>
                <Text>{item.data}</Text>
              </View>
            )}
          />
        </View>
        {!this.state.connected
          ? this.viewConnect()
          : !this.state.inConv
          ? this.btnStartLiveChat()
          : this.viewInConv()}

        <StringeeClient
          ref={this.client}
          eventHandlers={this.clientEventHandlers}
        />
      </View>
    );
  }

  styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      flex: 1,
      width: '100%',
    },
    box: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 5,
      height: '50%',
      width: '90%',
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
    item: {
      flex: 1,
      padding: 10,
      fontSize: 16,
    },
    text: {
      textAlign: 'center',
      color: '#F5FCFF',
      fontWeight: 'bold',
      fontSize: 15,
    },
    input: {
      height: 35,
      width: 280,
      borderWidth: 1,
      borderRadius: 5,
      marginTop: 20,
      textAlign: 'auto',
      backgroundColor: '#ECECEC',
    },
    rowButton: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
    },

    button: {
      width: 120,
      height: 40,
      marginTop: 40,
      justifyContent: 'center',
      backgroundColor: '#1E6738',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#fff',
    },
  });
}
