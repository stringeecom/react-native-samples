import React, {Component} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import {
  StringeeClient,
  Conversation,
  StringeeClientListener,
  ObjectType,
  ChangeType,
  NewMessageInfo,
} from 'stringee-react-native-v2';

const widgetKey = 'QXlQZHVWRlc1eTRLcjhuSjlPV2pHM0ZXQlNNK2ljTFZiSkdDdFNuMkJQL0Ztdy9MYzFBOXkwbDdGSm5UZTFNcA==';
let _conversation: Conversation;

export default class Customer extends Component {
  stringeeClient: StringeeClient;

  constructor(props) {
    super(props);

    this.stringeeClient = new StringeeClient();

    this.state = {
      userId: '',
      connected: false,
      inConv: false,
      clientId: '',
      log: [],
    };

    const clientListener = new StringeeClientListener();
    clientListener.onConnect = this.onConnect;
    clientListener.onDisConnect = this.onDisConnect;
    clientListener.onFailWithError = this.onFailWithError;
    clientListener.onRequestAccessToken = this.onRequestAccessToken;
    clientListener.onObjectChange = this.onObjectChange;
    clientListener.onTimeoutInQueue = this.onTimeoutInQueue;
    clientListener.onConversationEnded = this.onConversationEnded;
    clientListener.onUserBeginTyping = this.onUserBeginTyping;
    clientListener.onUserEndTyping = this.onUserEndTyping;
    this.stringeeClient.setListener(clientListener);
  }

  componentDidMount(): void {
    // Get chat profile
    this.stringeeClient
      .getChatProfile(widgetKey)
      .then(chatProfile => {
        console.log(
          'getChatProfile: success - Profile: ' + JSON.stringify(chatProfile),
        );
        this.state.log.push({
          data:
            'getChatProfile: success - Profile: ' + JSON.stringify(chatProfile),
        });
        this.setState({
          queueId: chatProfile.queues[1].id,
        });
      })
      .catch(error => {
        console.log('getChatProfile: ', error.message);
        this.state.log.push({
          data: 'getChatProfile: ' + error.message,
        });
      });
  }

  //Event
  // The client connects to Stringee server
  onConnect = (stringeeClient: StringeeClient, userId: string) => {
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
  onDisConnect = (stringeeClient: StringeeClient) => {
    console.log('onDisConnect');
    this.state.log.push({
      data: 'onDisConnect',
    });
    this.stringeeClient.disconnect();
    this.setState({
      userId: 'Disconnected',
      connected: false,
    });
  };

  // The client fails to connects to Stringee server
  onFailWithError = (
    stringeeClient: StringeeClient,
    code: number,
    message: string,
  ) => {
    console.log('onFailWithError: code-' + code + ' message: ' + message);
    this.state.log.push({
      data: 'onFailWithError: code-' + code + ' message: ' + message,
      connected: false,
    });
  };

  // Access token is expired. A new access token is required to connect to Stringee server
  onRequestAccessToken = (stringeeClient: StringeeClient) => {
    console.log('onRequestAccessToken');
    this.state.log.push({
      data: 'onRequestAccessToken',
      connected: false,
    });
    // Token để kết nối tới Stringee server đã hết bạn. Bạn cần lấy token mới và gọi connect lại ở đây
    // this.client.current.connect('NEW_TOKEN');
  };

  // Receive event of Conversation or Message
  onObjectChange = (
    stringeeClient: StringeeClient,
    objectType: ObjectType,
    objectChanges: Array,
    changeType: ChangeType,
  ) => {
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
  onTimeoutInQueue = (
    stringeeClient: StringeeClient,
    convId: string,
    customerId: string,
    customerName: string,
  ) => {
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
  onConversationEnded = (
    stringeeClient: StringeeClient,
    convId: string,
    endedBy: string,
  ) => {
    console.log(
      'onConversationEnded: convId - ' + convId + '\n endedby - ' + endedBy,
    );
    this.state.log.push({
      data:
        'onConversationEnded: convId - ' + convId + '\n endedby - ' + endedBy,
    });
    this.setState({
      inConv: false,
    });
  };

  // Receive when user send beginTyping
  onUserBeginTyping = (
    stringeeClient: StringeeClient,
    convId: string,
    userId: string,
    displayName: string,
  ) => {
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
  onUserEndTyping = (
    stringeeClient: StringeeClient,
    convId: string,
    userId: string,
    displayName: string,
  ) => {
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
            this.stringeeClient
              .getLiveChatToken(widgetKey, this.state.name, this.state.email)
              .then(token => {
                console.log('getLiveChatToken: ' + JSON.stringify(token));
                this.state.log.push({
                  data: 'getLiveChatToken - ' + JSON.stringify(token),
                });
                this.stringeeClient.connect(token);
              })
              .catch(error => {
                console.log('getLiveChatToken: ', error.message);
                this.state.log.push({
                  data: 'getLiveChatToken: ' + error.message,
                });
              });
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
            this.stringeeClient
              .createLiveChatConversation(this.state.queueId)
              .then(conversation => {
                _conversation = conversation;
                console.log(
                  'createLiveChatConversation: success - conversation:' +
                    JSON.stringify(_conversation),
                );
                this.state.log.push({
                  data:
                    'createLiveChatConversation: success - conversation:' +
                    JSON.stringify(_conversation),
                });
                this.setState({
                  inConv: true,
                });
              })
              .catch(error => {
                console.log('createLiveChatConversation: ', error.message);
                this.state.log.push({
                  data: 'createLiveChatConversation: ' + error.message,
                });
              });
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
              const message: NewMessageInfo = new NewMessageInfo({
                message: {
                  content: 'Test',
                },
                type: 1,
                convId: _conversation.id,
              });

              _conversation
                .sendMessage(message)
                .then(() => {
                  console.log('sendMessage: success');
                  this.state.log.push({
                    data: 'sendMessage: success',
                  });
                })
                .catch(error => {
                  console.log('sendMessage: ', error.message);
                  this.state.log.push({
                    data: 'sendMessage: ' + error.message,
                  });
                });
            }}>
            <Text style={this.styles.text}>Send message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={this.styles.button}
            onPress={() => {
              _conversation
                .endChat()
                .then(() => {
                  console.log('endChat: success');
                  this.state.log.push({
                    data: 'endChat: success',
                  });
                  this.setState({
                    inConv: false,
                  });
                })
                .catch(error => {
                  console.log('endChat: ', error.message);
                  this.state.log.push({
                    data: 'endChat: ' + error.message,
                  });
                });
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
