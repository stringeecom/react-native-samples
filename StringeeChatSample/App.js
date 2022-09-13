import React, {Component, createRef} from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {StringeeClient} from 'stringee-react-native';
import {Icon} from 'react-native-elements';
import ActShtCreateConversation from './src/ActShtCreateConversation';
import ActShtGetConversation from './src/ActShtGetConversation';
import ActShtParticipant from './src/ActShtParticipant';
import ActShtUpdateConversation from './src/ActShtUpdateConversation';
import ActShtSendMsg from './src/ActShtSendMsg';
import ActShtGetMessage from './src/ActShtGetMessage';
import ActShtMsgAction from './src/ActShtMsgAction';
import ActShtGetUserInfo from './src/ActShtGetUserInfo';
import ActShtUpdateUserInfo from './src/ActShtUpdateUserInfo';

const token =
  'eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTS0UxUmRVdFVhWXhOYVFRNFdyMTVxRjF6VUp1UWRBYVZULTE2NjMwNDMyMjQiLCJpc3MiOiJTS0UxUmRVdFVhWXhOYVFRNFdyMTVxRjF6VUp1UWRBYVZUIiwiZXhwIjoxNjY1NjM1MjI0LCJ1c2VySWQiOiJ1c2VyMSJ9.O6E7_IHRejlgPv8A9ag722FuDp0bKMeDK8y_9lMs_iY';

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userId: '',
      log: [],
      conversations: [],
      conversationLog: [],
      messages: [],
      modalVisible: false,
      selectedConv: undefined,
      selectedMsg: undefined,
      title: '',
    };

    this.client = createRef();

    this.createConvRef = createRef();
    this.getConvByIdRef = createRef();
    this.getConvAfterRef = createRef();
    this.getConvBeforeRef = createRef();
    this.getConvWithUserRef = createRef();
    this.getGetUserInfoRef = createRef();
    this.updateUserInfoRef = createRef();

    this.msgActionRef = createRef();
    this.addPartRef = createRef();
    this.removePartRef = createRef();
    this.updateConvRef = createRef();
    this.sendMsgRef = createRef();
    this.getMsgAfterRef = createRef();
    this.getMsgBeforeRef = createRef();
    this.getMsgById = createRef();

    this.clientEventHandlers = {
      onConnect: this.onConnect,
      onDisConnect: this.onDisConnect,
      onFailWithError: this.onFailWithError,
      onRequestAccessToken: this.onRequestAccessToken,
      onCustomMessage: this.onCustomMessage,
      onObjectChange: this.onObjectChange,
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
    this.setState({
      userId: userId,
    });
    this.addLog('onConnect - ' + userId);
  };

  // The client disconnects from Stringee server
  onDisConnect = () => {
    console.log('onDisConnect');
    this.setState({
      userId: '',
    });
    this.addLog('onDisConnect');
  };

  // The client fails to connects to Stringee server
  onFailWithError = ({code, message}) => {
    console.log('onFailWithError: code-' + code + ' message: ' + message);
    this.setState({
      userId: '',
    });
    this.addLog('onFailWithError: code-' + code + ' message: ' + message);
  };

  // Access token is expired. A new access token is required to connect to Stringee server
  onRequestAccessToken = () => {
    console.log('onRequestAccessToken');
    this.addLog('onRequestAccessToken');
    // Token để kết nối tới Stringee server đã hết bạn. Bạn cần lấy token mới và gọi connect lại ở đây
    // this.client.current.connect('NEW_TOKEN');
  };

  // Receive custom message
  onCustomMessage = ({data}) => {
    console.log('onCustomMessage: ' + data);
    this.addLog('onCustomMessage: ' + data);
  };

  // Receive event of Conversation or Message
  onObjectChange = ({objectType, objectChanges, changeType}) => {
    console.log(
      'onObjectChange: \nobjectType - ' +
        objectType +
        '\n changeType - ' +
        changeType +
        '\n objectChanges - ' +
        JSON.stringify(objectChanges),
    );
    this.addLog(
      'onObjectChange: \nobjectType - ' +
        objectType +
        '\n changeType - ' +
        changeType +
        '\n objectChanges - ' +
        JSON.stringify(objectChanges),
    );

    if (objectType === 1) {
      this.addConversationLog(
        'onObjectChange: \nobjectType - ' +
          objectType +
          '\n changeType - ' +
          changeType +
          '\n objectChanges - ' +
          JSON.stringify(objectChanges),
      );

      if (this.state.selectedMsg !== undefined) {
        if (this.state.selectedMsg.id === objectChanges[0].id) {
          this.setState({
            selectedMsg: objectChanges[0],
          });
        }
      }
    } else {
      if (this.state.selectedConv !== undefined) {
        if (this.state.selectedConv.id === objectChanges[0].id) {
          this.setState({
            selectedConv: objectChanges[0],
          });
        }
      }
    }
  };

  // Receive when user send beginTyping
  onUserBeginTyping = ({convId, userId, displayName}) => {
    console.log(
      'onUserBeginTyping: \nconvId - ' +
        convId +
        '\n userId - ' +
        userId +
        '\n displayName - ' +
        displayName,
    );
    this.addLog(
      'onUserBeginTyping: \nconvId - ' +
        convId +
        '\n userId - ' +
        userId +
        '\n displayName - ' +
        displayName,
    );
  };

  // Receive when user send endTyping
  onUserEndTyping = ({convId, userId, displayName}) => {
    console.log(
      'onUserEndTyping: \nconvId - ' +
        convId +
        '\n userId - ' +
        userId +
        '\n displayName - ' +
        displayName,
    );
    this.addLog(
      'onUserEndTyping: \nconvId - ' +
        convId +
        '\n userId - ' +
        userId +
        '\n displayName - ' +
        displayName,
    );
  };

  addLog = data => {
    let newLog = this.state.log;
    newLog.push(data);
    this.setState({log: newLog});
  };

  addConversation = conversation => {
    let newConversations = this.state.conversations;
    newConversations.push(conversation);
    this.setState({conversations: newConversations});
  };

  addConversationLog = data => {
    let newLog = this.state.conversationLog;
    newLog.push(data);
    this.setState({conversationLog: newLog});
  };

  addMessage = message => {
    let newMessages = this.state.messages;
    newMessages.push(message);
    this.setState({messages: newMessages});
  };

  // Actions
  createConversation = (options, participant) => {
    this.client.current.createConversation(
      participant,
      options,
      (status, code, message, conversation) => {
        console.log(
          'Create conversation: ' +
            message +
            ' \nconversation -' +
            JSON.stringify(conversation),
        );
        this.addLog('Create conversation: ' + message);
        if (status) {
          this.clearConversations();
          this.addConversation(conversation);
        }
      },
    );
  };

  getConversationById = convId => {
    this.client.current.getConversationById(
      convId,
      (status, code, message, conversation) => {
        console.log(
          'Get conversation by id: ' +
            message +
            ' \nconversation -' +
            JSON.stringify(conversation),
        );
        this.addLog('Get conversation by id: ' + message);
        if (status) {
          this.clearConversations();
          this.addConversation(conversation);
        }
      },
    );
  };

  getLocalConversations = () => {
    const count = 10;
    const isAscending = true;

    this.client.current.getLocalConversations(
      this.state.userId,
      count,
      isAscending,
      (status, code, message, conversations) => {
        console.log(
          'Get local conversations: ' +
            message +
            ' \nconversations -' +
            JSON.stringify(conversations),
        );
        this.addLog('Get local conversations: ' + message);
        if (status) {
          this.clearConversations();
          conversations.forEach(conversation => {
            this.addConversation(conversation);
          });
        }
      },
    );
  };

  getLastConversations = () => {
    const count = 10;
    const isAscending = true;

    this.client.current.getLastConversations(
      count,
      isAscending,
      (status, code, message, conversations) => {
        console.log(
          'Get last conversations: ' +
            message +
            ' \nconversations -' +
            JSON.stringify(conversations),
        );
        this.addLog('Get last conversations: ' + message);
        if (status) {
          this.clearConversations();
          conversations.forEach(conversation => {
            this.addConversation(conversation);
          });
        }
      },
    );
  };

  getConversationsBefore = dateTime => {
    const count = 10;
    const isAscending = true;

    this.client.current.getConversationsBefore(
      dateTime,
      count,
      isAscending,
      (status, code, message, conversations) => {
        console.log(
          'Get conversations before: ' +
            message +
            ' \nconversations -' +
            JSON.stringify(conversations),
        );
        this.addLog('Get conversations before: ' + message);
        if (status) {
          this.clearConversations();
          conversations.forEach(conversation => {
            this.addConversation(conversation);
          });
        }
      },
    );
  };

  getConversationsAfter = dateTime => {
    const count = 10;
    const isAscending = true;

    this.client.current.getConversationsAfter(
      dateTime,
      count,
      isAscending,
      (status, code, message, conversations) => {
        console.log(
          'Get conversations after: ' +
            message +
            ' \nconversations -' +
            JSON.stringify(conversations),
        );
        this.addLog('Get conversations after: ' + message);
        if (status) {
          this.clearConversations();
          conversations.forEach(conversation => {
            this.addConversation(conversation);
          });
        }
      },
    );
  };

  getConversationWithUser = userId => {
    this.client.current.getConversationWithUser(
      userId,
      (status, code, message, conversation) => {
        console.log(
          'Get conversation with user: ' +
            message +
            ' \nconversations -' +
            JSON.stringify(conversation),
        );
        this.addLog('Get conversations with user: ' + message);
        if (status) {
          this.clearConversations();
          this.addConversation(conversation);
        }
      },
    );
  };

  getUnreadConversationCount = () => {
    this.client.current.getUnreadConversationCount(
      (status, code, message, count) => {
        console.log(
          'Get unread conversation count: ' + message + ' \ncount -' + count,
        );
        this.addLog('Get unread conversation count: ' + message);
      },
    );
  };

  getUserInfo = userIds => {
    this.client.current.getUserInfo(userIds, (status, code, message, users) => {
      console.log(
        'Get user info: ' + message + ' \nusers -' + JSON.stringify(users),
      );
      this.addLog(
        'Get user info: ' + message + ' \nusers -' + JSON.stringify(users),
      );
    });
  };

  updateUserInfo = userInfo => {
    this.client.current.updateUserInfoWithParam(
      userInfo,
      (status, code, message) => {
        console.log('Update user info: ' + message);
        this.addLog('Update user info: ' + message);
      },
    );
  };

  clearDb = () => {
    this.client.current.clearDb((status, code, message) => {
      console.log('Get unread conversation count: ' + message);
      this.addLog('Get unread conversation count: ' + message);
    });
  };

  deleteConversation = () => {
    this.client.current.deleteConversation(
      this.state.selectedConv.id,
      (status, code, message) => {
        console.log('Delete conversation: ' + message);
        this.addConversationLog('Delete conversation: ' + message);
      },
    );
  };

  addParticipants = participants => {
    if (this.state.selectedConv.isGroup) {
      this.client.current.addParticipants(
        this.state.selectedConv.id,
        participants,
        (status, code, message, users) => {
          console.log(
            'Add participants: ' +
              message +
              '\nusers - ' +
              JSON.stringify(users),
          );
          this.addConversationLog(
            'Add participants: ' +
              message +
              '\nusers - ' +
              JSON.stringify(users),
          );
        },
      );
    }
  };

  removeParticipants = participants => {
    if (this.state.selectedConv.isGroup) {
      this.client.current.removeParticipants(
        this.state.selectedConv.id,
        participants,
        (status, code, message, users) => {
          console.log(
            'Remove participants: ' +
              message +
              '\nusers - ' +
              JSON.stringify(users),
          );
          this.addConversationLog(
            'Remove participants: ' +
              message +
              '\nusers - ' +
              JSON.stringify(users),
          );
        },
      );
    }
  };

  updateConversation = (convName, avatar) => {
    const params = {
      name: convName,
      avatar: avatar,
    };
    this.client.current.updateConversation(
      this.state.selectedConv.id,
      params,
      (status, code, message) => {
        console.log('Update conversation: ' + message);
        this.addConversationLog('Update conversation: ' + message);
      },
    );
  };

  sendBeginTyping = () => {
    this.client.current.sendBeginTyping(
      this.state.selectedConv.id,
      (status, code, message) => {
        console.log('Send begin typing: ' + message);
        this.addConversationLog('Send begin typing: ' + message);
      },
    );
  };

  sendEndTyping = () => {
    this.client.current.sendEndTyping(
      this.state.selectedConv.id,
      (status, code, message) => {
        console.log('Send end typing: ' + message);
        this.addConversationLog('Send end typing: ' + message);
      },
    );
  };

  sendMessage = content => {
    const msg = {
      message: {
        // for message text + message link
        content: content,

        // for message photo
        photo: {
          filePath: 'link file',
          thumbnail: 'file thumbnail',
          ratio: 1,
        },

        // for message video
        video: {
          filePath: 'link file',
          thumbnail: 'file thumbnail',
          ratio: 1,
          duration: 20,
        },

        // for message audio
        audio: {
          filePath: 'link file',
          duration: 20,
        },

        // for message file
        file: {
          filePath: 'link file',
          filename: 'file name',
          length: 20000,
        },

        // for message location
        location: {
          lat: 21.003465,
          lon: 105.822619,
        },

        // for message contact
        contact: {
          vcard: 'vcard',
        },

        // for message sticker
        sticker: {
          category: 'sticker category',
          name: 'sticker name',
        },
      },
      // The type of the message:
      // - type = 1: Text.
      // - type = 2: Photo.
      // - type = 3: Video.
      // - type = 4: Audio.
      // - type = 5: File.
      // - type = 6: Link.
      // - type = 9: Location.
      // - type = 10: Contact.
      // - type = 11: Sticker.
      type: 1,
      convId: this.state.selectedConv.id,
    };
    this.client.current.sendMessage(msg, (status, code, message) => {
      console.log('Send message: ' + message);
      this.addConversationLog('Send message: ' + message);
    });
  };

  getLocalMessages = () => {
    const count = 10;
    const isAscending = true;

    this.client.current.getLocalMessages(
      this.state.selectedConv.id,
      count,
      isAscending,
      (status, code, message, messages) => {
        console.log(
          'Get local messages: ' +
            message +
            '\nmessages - ' +
            JSON.stringify(messages),
        );
        this.addConversationLog('Get local messages: ' + message);
        if (status) {
          this.clearMsgs();
          messages.forEach(msg => {
            this.addMessage(msg);
          });
        }
      },
    );
  };

  getLastMessages = () => {
    const count = 10;
    const isAscending = true;
    const loadDeletedMessage = false;
    const loadDeletedMessageContent = false;

    this.client.current.getLastMessages(
      this.state.selectedConv.id,
      count,
      isAscending,
      loadDeletedMessage,
      loadDeletedMessageContent,
      (status, code, message, messages) => {
        console.log(
          'Get last messages: ' +
            message +
            '\nmessages - ' +
            JSON.stringify(messages),
        );
        this.addConversationLog('Get last messages: ' + message);
        if (status) {
          this.clearMsgs();
          messages.forEach(msg => {
            this.addMessage(msg);
          });
        }
      },
    );
  };

  getMessagesAfter = sequence => {
    const count = 10;
    const isAscending = true;
    const loadDeletedMessage = false;
    const loadDeletedMessageContent = false;

    this.client.current.getMessagesAfter(
      this.state.selectedConv.id,
      sequence,
      count,
      isAscending,
      loadDeletedMessage,
      loadDeletedMessageContent,
      (status, code, message, messages) => {
        console.log(
          'Get messages after: ' +
            message +
            '\nmessages - ' +
            JSON.stringify(messages),
        );
        this.addConversationLog('Get messages after: ' + message);
        if (status) {
          this.clearMsgs();
          messages.forEach(msg => {
            this.addMessage(msg);
          });
        }
      },
    );
  };

  getMessagesBefore = sequence => {
    const count = 10;
    const isAscending = true;
    const loadDeletedMessage = false;
    const loadDeletedMessageContent = false;

    this.client.current.getMessagesBefore(
      this.state.selectedConv.id,
      sequence,
      count,
      isAscending,
      loadDeletedMessage,
      loadDeletedMessageContent,
      (status, code, message, messages) => {
        console.log(
          'Get messages before: ' +
            message +
            '\nmessages - ' +
            JSON.stringify(messages),
        );
        this.addConversationLog('Get messages before: ' + message);
        if (status) {
          this.clearMsgs();
          messages.forEach(msg => {
            this.addMessage(msg);
          });
        }
      },
    );
  };

  getMessageById = msgId => {
    this.client.current.getMessageById(
      this.state.selectedConv.id,
      msgId,
      (status, code, message, msg) => {
        console.log(
          'Get message by id: ' +
            message +
            '\nmessage - ' +
            JSON.stringify(msg),
        );
        this.addConversationLog('Get message by id: ' + message);
        if (status) {
          this.clearMsgs();
          this.addMessage(msg);
        }
      },
    );
  };

  markConversationAsRead = () => {
    this.client.current.markConversationAsRead(
      this.state.selectedConv.id,
      (status, code, message) => {
        console.log('Mark conversation as read: ' + message);
        this.addConversationLog('Mark conversation as read: ' + message);
      },
    );
  };

  editMessage = newContent => {
    this.client.current.editMessage(
      this.state.selectedConv.id,
      this.state.selectedMsg.id,
      newContent,
      (status, code, message) => {
        console.log('Edit message: ' + message);
        this.addConversationLog('Edit message: ' + message);
      },
    );
  };

  pinMessage = () => {
    const pin = this.state.selectedMsg.id !== this.state.selectedConv.pinMsgId;
    this.client.current.pinMessage(
      this.state.selectedConv.id,
      this.state.selectedMsg.id,
      pin,
      (status, code, message) => {
        if (pin) {
          console.log('Pin message: ' + message);
          this.addConversationLog('Pin message: ' + message);
        } else {
          console.log('Unpin message: ' + message);
          this.addConversationLog('Unpin message: ' + message);
        }
      },
    );
  };

  deleteMessage = () => {
    this.client.current.deleteMessage(
      this.state.selectedConv.id,
      this.state.selectedMsg.id,
      (status, code, message) => {
        console.log('Delete message: ' + message);
        this.addConversationLog('Delete message: ' + message);
      },
    );
  };

  revokeMessage = () => {
    this.client.current.revokeMessage(
      this.state.selectedConv.id,
      this.state.selectedMsg.id,
      (status, code, message) => {
        console.log('Revoke message: ' + message);
        this.addConversationLog('Revoke message: ' + message);
      },
    );
  };

  clearLog = () => {
    this.setState({log: []});
  };

  clearConversations = () => {
    this.setState({conversations: []});
  };

  clearMsgLog = () => {
    this.setState({conversationLog: []});
  };

  clearMsgs = () => {
    this.setState({messages: []});
  };

  render(): React.ReactNode {
    return (
      <SafeAreaView style={this.styles.container}>
        <View style={this.styles.row}>
          <Text style={this.styles.title}>Log:</Text>
          <TouchableOpacity
            style={this.styles.cleanButton}
            onPress={() => {
              this.clearLog();
            }}>
            <Icon name="cleaning-services" s color="#000000" />
          </TouchableOpacity>
        </View>

        <View style={this.styles.box}>
          <FlatList
            style={this.styles.list}
            data={this.state.log}
            renderItem={({item}) => (
              <View style={this.styles.item}>
                <Text>{item}</Text>
              </View>
            )}
          />
        </View>

        <View style={this.styles.row}>
          <Text style={this.styles.title}>Conversations:</Text>
        </View>

        <View style={this.styles.box}>
          <FlatList
            style={this.styles.list}
            data={this.state.conversations}
            renderItem={({item}) => (
              <View style={this.styles.itemBox}>
                <TouchableOpacity
                  style={this.styles.dataItem}
                  onPress={() => {
                    this.clearMsgLog();
                    this.clearMsgs();
                    this.setState({
                      modalVisible: !this.state.modalVisible,
                      selectedConv: item,
                    });
                  }}>
                  <Text>{item.id}</Text>
                </TouchableOpacity>
                <View style={this.styles.divider} />
              </View>
            )}
          />
        </View>

        <View style={this.styles.containerBottom}>
          <ScrollView>
            <View style={this.styles.container}>
              <View style={this.styles.rowButton}>
                <TouchableOpacity
                  style={this.styles.button}
                  onPress={() => {
                    this.createConvRef.current.show();
                  }}>
                  <Text style={this.styles.text}>Create conversation</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={this.styles.button}
                  onPress={() => {
                    this.getConvByIdRef.current.show();
                  }}>
                  <Text style={this.styles.text}>Get conversation by id</Text>
                </TouchableOpacity>
              </View>
              <View style={this.styles.rowButton}>
                <TouchableOpacity
                  style={this.styles.button}
                  onPress={() => {
                    this.getLocalConversations();
                  }}>
                  <Text style={this.styles.text}>Get local conversations</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={this.styles.button}
                  onPress={() => {
                    this.getLastConversations();
                  }}>
                  <Text style={this.styles.text}>Get last conversations</Text>
                </TouchableOpacity>
              </View>
              <View style={this.styles.rowButton}>
                <TouchableOpacity
                  style={this.styles.button}
                  onPress={() => {
                    this.getConvAfterRef.current.show();
                  }}>
                  <Text style={this.styles.text}>Get conversations after</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={this.styles.button}
                  onPress={() => {
                    this.getConvBeforeRef.current.show();
                  }}>
                  <Text style={this.styles.text}>Get conversation before</Text>
                </TouchableOpacity>
              </View>
              <View style={this.styles.rowButton}>
                <TouchableOpacity
                  style={this.styles.button}
                  onPress={() => {
                    this.getConvWithUserRef.current.show();
                  }}>
                  <Text style={this.styles.text}>
                    Get conversation with user
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={this.styles.button}
                  onPress={() => {
                    this.getUnreadConversationCount();
                  }}>
                  <Text style={this.styles.text}>
                    Get unread conversations count
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={this.styles.rowButton}>
                <TouchableOpacity
                  style={this.styles.button}
                  onPress={() => {
                    this.getGetUserInfoRef.current.show();
                  }}>
                  <Text style={this.styles.text}>Get user's info</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={this.styles.button}
                  onPress={() => {
                    this.client.current.getUserInfo(
                      [this.state.userId],
                      (status, code, message, users) => {
                        if (status) {
                          this.updateUserInfoRef.current.setUserInfo(users[0]);
                          this.updateUserInfoRef.current.show();
                        }
                      },
                    );
                  }}>
                  <Text style={this.styles.text}>Update user's info</Text>
                </TouchableOpacity>
              </View>
              <View style={this.styles.rowButton}>
                <TouchableOpacity
                  style={this.styles.button}
                  onPress={() => {
                    this.clearDb();
                  }}>
                  <Text style={this.styles.text}>Clear db</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>

        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            this.setState({
              modalVisible: !this.state.modalVisible,
              selectedConv: undefined,
            });
          }}>
          <SafeAreaView style={this.styles.container}>
            <View style={this.styles.header}>
              <TouchableOpacity
                style={this.styles.backButton}
                onPress={() => {
                  this.setState({
                    modalVisible: !this.state.modalVisible,
                  });
                }}>
                <Icon name="arrow-back-ios" s color="#ffffff" />
              </TouchableOpacity>
              <Text style={this.styles.headerTitle}>
                {this.state.selectedConv === undefined
                  ? ''
                  : this.state.selectedConv.id}
              </Text>
            </View>

            <View style={this.styles.row}>
              <Text style={this.styles.title}>Log:</Text>
              <TouchableOpacity
                style={this.styles.cleanButton}
                onPress={() => {
                  this.clearMsgLog();
                }}>
                <Icon name="cleaning-services" s color="#000000" />
              </TouchableOpacity>
            </View>

            <View style={this.styles.box}>
              <FlatList
                style={this.styles.list}
                data={this.state.conversationLog}
                renderItem={({item}) => (
                  <View style={this.styles.item}>
                    <Text>{item}</Text>
                  </View>
                )}
              />
            </View>

            <View style={this.styles.row}>
              <Text style={this.styles.title}>Message:</Text>
            </View>

            <View style={this.styles.box}>
              <FlatList
                style={this.styles.list}
                data={this.state.messages}
                renderItem={({item}) => (
                  <View style={this.styles.itemBox}>
                    <TouchableOpacity
                      style={this.styles.dataItem}
                      onPress={() => {
                        this.setState({selectedMsg: item});
                        this.msgActionRef.current.show();
                      }}>
                      <Text>{item.id}</Text>
                    </TouchableOpacity>
                    <View style={this.styles.divider} />
                  </View>
                )}
              />
            </View>

            <View style={this.styles.containerBottom}>
              <ScrollView>
                <View style={this.styles.container}>
                  <View style={this.styles.rowButton}>
                    <TouchableOpacity
                      style={this.styles.button}
                      onPress={() => {
                        this.deleteConversation();
                      }}>
                      <Text style={this.styles.text}>Delete conversation</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={this.styles.button}
                      onPress={() => {
                        this.addPartRef.current.show();
                      }}>
                      <Text style={this.styles.text}>Add participant</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={this.styles.rowButton}>
                    <TouchableOpacity
                      style={this.styles.button}
                      onPress={() => {
                        this.removePartRef.current.show();
                      }}>
                      <Text style={this.styles.text}>Remove participant</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={this.styles.button}
                      onPress={() => {
                        this.updateConvRef.current.show();
                      }}>
                      <Text style={this.styles.text}>Update conversation</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={this.styles.rowButton}>
                    <TouchableOpacity
                      style={this.styles.button}
                      onPress={() => {
                        this.sendBeginTyping();
                      }}>
                      <Text style={this.styles.text}>Send begin typing</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={this.styles.button}
                      onPress={() => {
                        this.sendEndTyping();
                      }}>
                      <Text style={this.styles.text}>Send end typing</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={this.styles.rowButton}>
                    <TouchableOpacity
                      style={this.styles.button}
                      onPress={() => {
                        this.sendMsgRef.current.show();
                      }}>
                      <Text style={this.styles.text}>Send message</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={this.styles.button}
                      onPress={() => {
                        this.getLocalMessages();
                      }}>
                      <Text style={this.styles.text}>Get local messages</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={this.styles.rowButton}>
                    <TouchableOpacity
                      style={this.styles.button}
                      onPress={() => {
                        this.getLastMessages();
                      }}>
                      <Text style={this.styles.text}>Get last messages</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={this.styles.button}
                      onPress={() => {
                        this.getMsgAfterRef.current.show();
                      }}>
                      <Text style={this.styles.text}>Get messages after</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={this.styles.rowButton}>
                    <TouchableOpacity
                      style={this.styles.button}
                      onPress={() => {
                        this.getMsgBeforeRef.current.show();
                      }}>
                      <Text style={this.styles.text}>Get messages before</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={this.styles.button}
                      onPress={() => {
                        this.getMsgById.current.show();
                      }}>
                      <Text style={this.styles.text}>Get message by id</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={this.styles.rowButton}>
                    <TouchableOpacity
                      style={this.styles.button}
                      onPress={() => {
                        this.markConversationAsRead();
                      }}>
                      <Text style={this.styles.text}>
                        Mark conversation as read
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>

            <ActShtParticipant
              ref={this.addPartRef}
              title={'Add'}
              data={participants => {
                this.addParticipants(participants);
              }}
            />

            <ActShtParticipant
              ref={this.removePartRef}
              title={'Remove'}
              data={participants => {
                this.removeParticipants(participants);
              }}
            />

            <ActShtUpdateConversation
              ref={this.updateConvRef}
              data={(convName, avatar) => {
                this.updateConversation(convName, avatar);
              }}
            />

            <ActShtSendMsg
              ref={this.sendMsgRef}
              data={content => {
                this.sendMessage(content);
              }}
            />

            <ActShtGetMessage
              ref={this.getMsgAfterRef}
              isNumber={true}
              title={'Sequence'}
              data={sequence => {
                this.getMessagesAfter(sequence);
              }}
            />

            <ActShtGetMessage
              ref={this.getMsgBeforeRef}
              isNumber={true}
              title={'Sequence'}
              data={sequence => {
                this.getMessagesBefore(sequence);
              }}
            />

            <ActShtGetMessage
              ref={this.getMsgById}
              title={'Message id'}
              data={msgId => {
                this.getMessageById(msgId);
              }}
            />

            <ActShtMsgAction
              ref={this.msgActionRef}
              onClose={() => {
                this.setState({selectedMsg: undefined});
              }}
              data={(type, data) => {
                if (type === 'editMessage') {
                  this.editMessage(data);
                } else if (type === 'pinMessage') {
                  this.pinMessage();
                } else if (type === 'deleteMessage') {
                  this.deleteMessage();
                } else if (type === 'revokeMessage') {
                  this.revokeMessage();
                }
              }}
            />
          </SafeAreaView>
        </Modal>

        <ActShtCreateConversation
          ref={this.createConvRef}
          data={(options, participant) => {
            this.createConversation(options, participant);
          }}
        />

        <ActShtGetConversation
          ref={this.getConvByIdRef}
          title={'Conversation id'}
          data={convId => {
            this.getConversationById(convId);
          }}
        />

        <ActShtGetConversation
          ref={this.getConvAfterRef}
          isNumber={true}
          title={'Time in milli second'}
          data={dateTime => {
            this.getConversationsAfter(dateTime);
          }}
        />

        <ActShtGetConversation
          ref={this.getConvBeforeRef}
          isNumber={true}
          title={'Time in milli second'}
          data={dateTime => {
            this.getConversationsBefore(dateTime);
          }}
        />

        <ActShtGetConversation
          ref={this.getConvWithUserRef}
          title={'User id'}
          data={userId => {
            this.getConversationWithUser(userId);
          }}
        />

        <ActShtGetUserInfo
          ref={this.getGetUserInfoRef}
          data={userIds => {
            this.getUserInfo(userIds);
          }}
        />

        <ActShtUpdateUserInfo
          ref={this.updateUserInfoRef}
          data={userInfo => {
            console.log(userInfo);
            this.updateUserInfo(userInfo);
          }}
        />

        <StringeeClient
          ref={this.client}
          eventHandlers={this.clientEventHandlers}
        />
      </SafeAreaView>
    );
  }

  styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    containerBottom: {
      marginTop: 20,
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    list: {
      flex: 1,
      width: '100%',
    },
    box: {
      borderWidth: 1,
      borderRadius: 5,
      height: '30%',
      width: '90%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      width: '100%',
      height: 50,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1E6738',
    },
    headerTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'left',
      color: '#F5FCFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    row: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 16,
      textAlign: 'left',
      paddingLeft: 10,
      margin: 10,
      fontWeight: 'bold',
    },
    item: {
      flex: 1,
      paddingLeft: 10,
      fontSize: 16,
    },
    itemBox: {
      flex: 1,
      height: 40,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    dataItem: {
      flex: 1,
      paddingLeft: 10,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'flex-start',
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
      marginBottom: 10,
      paddingVertical: 10,
      paddingHorizontal: 5,
      width: '45%',
      justifyContent: 'center',
      backgroundColor: '#1E6738',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#fff',
    },
    backButton: {
      height: 50,
      width: 50,
      justifyContent: 'center',
    },
    cleanButton: {
      marginRight: 20,
      justifyContent: 'center',
    },
    divider: {
      width: '100%',
      height: 1,
      backgroundColor: 'black',
    },
  });
}
