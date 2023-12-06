import React, {Component} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, FlatList} from 'react-native';
import {
  StringeeClient,
  Conversation,
  ChatRequest,
  StringeeClientListener,
  ObjectType,
  ChangeType,
  NewMessageInfo,
} from 'stringee-react-native-v2';

const token = 'PUT_YOUR_TOKEN_HERE';
let _conversation: Conversation;
let _chatRequest: ChatRequest;

export default class Agent extends Component {
  stringeeClient: StringeeClient;
  constructor(props) {
    super(props);

    this.stringeeClient = new StringeeClient();

    this.state = {
      userId: '',
      inConv: false,
      inRequest: false,
      clientId: '',
      log: [],
    };

    const clientListener = new StringeeClientListener();
    clientListener.onConnect = this.onConnect;
    clientListener.onDisConnect = this.onDisConnect;
    clientListener.onFailWithError = this.onFailWithError;
    clientListener.onRequestAccessToken = this.onRequestAccessToken;
    clientListener.onObjectChange = this.onObjectChange;
    clientListener.onReceiveChatRequest = this.onReceiveChatRequest;
    clientListener.onReceiveTransferChatRequest =
      this.onReceiveTransferChatRequest;
    clientListener.onTimeoutAnswerChat = this.onTimeoutAnswerChat;
    clientListener.onConversationEnded = this.onConversationEnded;
    clientListener.onUserBeginTyping = this.onUserBeginTyping;
    clientListener.onUserEndTyping = this.onUserEndTyping;
    this.stringeeClient.setListener(clientListener);
  }

  componentDidMount(): void {
    this.stringeeClient.connect(token);
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
    });
  };

  // Access token is expired. A new access token is required to connect to Stringee server
  onRequestAccessToken = (stringeeClient: StringeeClient) => {
    console.log('onRequestAccessToken');
    this.state.log.push({
      data: 'onRequestAccessToken',
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
  onReceiveChatRequest = (
    stringeeClient: StringeeClient,
    chatRequest: ChatRequest,
  ) => {
    console.log(
      'onReceiveChatRequest: chatRequest - ' + JSON.stringify(chatRequest),
    );
    this.state.log.push({
      data:
        'onReceiveChatRequest: chatRequest - ' + JSON.stringify(chatRequest),
    });
    _chatRequest = chatRequest;
    this.setState({
      inRequest: true,
    });
  };

  // Receive when chat request to queue is timeout
  onReceiveTransferChatRequest = (
    stringeeClient: StringeeClient,
    chatRequest: ChatRequest,
  ) => {
    console.log(
      'onReceiveTransferChatRequest: chatRequest - ' +
        JSON.stringify(chatRequest),
    );
    _chatRequest = chatRequest;
    this.state.log.push({
      data:
        'onReceiveTransferChatRequest: chatRequest - ' +
        JSON.stringify(chatRequest),
    });
    this.setState({
      inRequest: true,
    });
  };

  // Receive when chat request to queue is timeout
  onTimeoutAnswerChat = (
    stringeeClient: StringeeClient,
    chatRequest: ChatRequest,
  ) => {
    console.log(
      'onTimeoutAnswerChat: chatRequest - ' + JSON.stringify(chatRequest),
    );
    this.state.log.push({
      data: 'onTimeoutAnswerChat: chatRequest - ' + JSON.stringify(chatRequest),
    });
    this.setState({
      inRequest: false,
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

  viewInRequest = () => {
    return (
      <View style={this.styles.container}>
        <View style={this.styles.rowButton}>
          <TouchableOpacity
            style={this.styles.button}
            onPress={() => {
              _chatRequest
                .acceptChatRequest()
                .then(() => {
                  console.log('acceptChatRequest: success');
                  this.state.log.push({
                    data: 'acceptChatRequest: success',
                  });
                  this.setState({
                    inRequest: false,
                  });
                  this.stringeeClient
                    .getConversationById(_chatRequest.convId)
                    .then(conversation => {
                      console.log(
                        'getConversationById: success - conversation:',
                        JSON.stringify(conversation),
                      );
                      this.state.log.push({
                        data:
                          'getConversationById: success - conversation:' +
                          JSON.stringify(conversation),
                      });
                      _conversation = conversation;
                      this.setState({
                        inConv: true,
                      });
                    })
                    .catch(error => {
                      console.log('getConversationById: ', error.message);
                      this.state.log.push({
                        data: 'getConversationById: ' + error.message,
                      });
                    });
                })
                .catch(error => {
                  console.log('acceptChatRequest: ', error.message);
                  this.state.log.push({
                    data: 'acceptChatRequest: ' + error.message,
                  });
                });
            }}>
            <Text style={this.styles.text}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={this.styles.button}
            onPress={() => {
              _chatRequest
                .rejectChatRequest(_chatRequest)
                .then(() => {
                  console.log('acceptChatRequest: success');
                  this.state.log.push({
                    data: 'acceptChatRequest: success',
                  });
                  this.setState({
                    inRequest: false,
                  });
                })
                .catch(error => {
                  console.log('rejectChatRequest: ', error.message);
                  this.state.log.push({
                    data: 'rejectChatRequest: ' + error.message,
                  });
                });
            }}>
            <Text style={this.styles.text}>Reject</Text>
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
        {this.state.inRequest
          ? this.viewInRequest()
          : this.state.inConv && this.viewInConv()}
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
