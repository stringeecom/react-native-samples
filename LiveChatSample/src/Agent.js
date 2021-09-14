import React, {Component, createRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import {StringeeClient, Conversation, ChatRequest} from 'stringee-react-native';

const token = 'YOUR_ACCESS_TOKEN';
var _conversation: Conversation;
var _chatRequest: ChatRequest;

export default class Agent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userId: '',
      inConv: false,
      inRequest: false,
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
      onReceiveChatRequest: this.onReceiveChatRequest,
      onReceiveTransferChatRequest: this.onReceiveTransferChatRequest,
      onTimeoutAnswerChat: this.onTimeoutAnswerChat,
      onConversationEnded: this.onConversationEnded,
      onUserBeginTyping: this.onUserBeginTyping,
      onUserEndTyping: this.onUserEndTyping,
    };
  }

  componentDidMount(): void {
    this.client.current.connect(token);
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
    });
  };

  // The client fails to connects to Stringee server
  onFailWithError = ({code, message}) => {
    console.log('onFailWithError: code-' + code + ' message: ' + message);
    this.state.log.push({
      data: 'onFailWithError: code-' + code + ' message: ' + message,
    });
  };

  // Access token is expired. A new access token is required to connect to Stringee server
  onRequestAccessToken = () => {
    console.log('onRequestAccessToken');
    this.state.log.push({
      data: 'onRequestAccessToken',
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
  onReceiveChatRequest = ({request}) => {
    console.log(
      'onReceiveChatRequest: chatRequest - ' + JSON.stringify(request),
    );
    this.state.log.push({
      data: 'onReceiveChatRequest: chatRequest - ' + JSON.stringify(request),
    });
    _chatRequest = request;
    this.setState({
      inRequest: true,
    });
  };

  // Receive when chat request to queue is timeout
  onReceiveTransferChatRequest = ({request}) => {
    console.log(
      'onReceiveTransferChatRequest: chatRequest - ' + JSON.stringify(request),
    );
    _chatRequest = request;
    this.state.log.push({
      data:
        'onReceiveTransferChatRequest: chatRequest - ' +
        JSON.stringify(request),
    });
    this.setState({
      inRequest: true,
    });
  };

  // Receive when chat request to queue is timeout
  onTimeoutAnswerChat = ({request}) => {
    console.log(
      'onTimeoutAnswerChat: chatRequest - ' + JSON.stringify(request),
    );
    this.state.log.push({
      data: 'onTimeoutAnswerChat: chatRequest - ' + JSON.stringify(request),
    });
    this.setState({
      inRequest: false,
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

  viewInRequest = () => {
    return (
      <View style={this.styles.container}>
        <View style={this.styles.rowButton}>
          <TouchableOpacity
            style={this.styles.button}
            onPress={() => {
              this.client.current.acceptChatRequest(
                _chatRequest,
                (status, code, message) => {
                  console.log(
                    'acceptChatRequest: status - ' +
                      status +
                      ' code - ' +
                      code +
                      ' message - ' +
                      message,
                  );
                  this.state.log.push({
                    data:
                      'acceptChatRequest: status - ' +
                      status +
                      ' code - ' +
                      code +
                      ' message - ' +
                      message,
                  });
                  this.setState({
                    inRequest: false,
                  });
                  if (status) {
                    this.client.current.getConversationById(
                      _chatRequest.convId,
                      (status, code, message, conversation) => {
                        _conversation = conversation;
                        console.log(
                          'getConversationById: status - ' +
                            status +
                            ' code - ' +
                            code +
                            ' message - ' +
                            message +
                            ' conversation - ' +
                            JSON.stringify(conversation),
                        );
                        this.state.log.push({
                          data:
                            'getConversationById: status - ' +
                            status +
                            ' code - ' +
                            code +
                            ' message - ' +
                            message +
                            ' conversation - ' +
                            JSON.stringify(conversation),
                        });
                        this.setState({
                          inConv: true,
                        });
                      },
                    );
                  }
                },
              );
            }}>
            <Text style={this.styles.text}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={this.styles.button}
            onPress={() => {
              this.client.current.rejectChatRequest(
                _chatRequest,
                (status, code, message) => {
                  console.log(
                    'rejectChatRequest: status - ' +
                      status +
                      ' code - ' +
                      code +
                      ' message - ' +
                      message,
                  );
                  this.state.log.push({
                    data:
                      'rejectChatRequest: status - ' +
                      status +
                      ' code - ' +
                      code +
                      ' message - ' +
                      message,
                  });
                  this.setState({
                    inRequest: false,
                  });
                },
              );
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

        <StringeeClient
          ref={this.client}
          eventHandlers={this.clientEventHandlers}
          serverAddresses={this.serverAddresses}
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
