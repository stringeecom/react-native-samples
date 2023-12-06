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
import {
  StringeeClient,
  StringeeClientListener,
  ConversationOption,
  ObjectType,
  ChangeType,
  UserInfo,
  NewMessageInfo,
} from 'stringee-react-native-v2';

const token = 'PUT_YOUR_TOKEN_HERE';

export default class App extends Component {
  stringeeClient: StringeeClient;

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

    this.stringeeClient = new StringeeClient();

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

    const clientListener = new StringeeClientListener();
    clientListener.onConnect = this.onConnect;
    clientListener.onDisConnect = this.onDisConnect;
    clientListener.onFailWithError = this.onFailWithError;
    clientListener.onRequestAccessToken = this.onRequestAccessToken;
    clientListener.onObjectChange = this.onObjectChange;
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
    console.log('onConnect: ', userId);
    this.setState({
      userId: userId,
    });
    this.addLog('onConnect: ' + userId);
  };

  // The client disconnects from Stringee server
  onDisConnect = (stringeeClient: StringeeClient) => {
    console.log('onDisConnect');
    this.setState({
      userId: 'Disconnected',
    });
    this.addLog('onDisConnect');
  };

  // The client fails to connects to Stringee server
  onFailWithError = (
    stringeeClient: StringeeClient,
    code: number,
    message: string,
  ) => {
    console.log('onFailWithError: code - ' + code + ', message - ' + message);
    this.setState({
      userId: message,
    });
    this.addLog('onFailWithError: code - ' + code + ', message - ' + message);
  };

  // Access token is expired. A new access token is required to connect to Stringee server
  onRequestAccessToken = (stringeeClient: StringeeClient) => {
    console.log('onRequestAccessToken');
    this.addLog('onRequestAccessToken');
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
      'onObjectChange: \nobjectType - ' +
        objectType +
        '\nchangeType - ' +
        changeType +
        '\nobjectChanges - ' +
        JSON.stringify(objectChanges),
    );
    this.addLog(
      'onObjectChange: \nobjectType - ' +
        objectType +
        '\nchangeType - ' +
        changeType +
        '\nobjectChanges - ' +
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
  onUserBeginTyping = (
    stringeeClient: StringeeClient,
    convId: string,
    userId: string,
    displayName: string,
  ) => {
    console.log(
      'onUserBeginTyping: \nconvId - ' +
        convId +
        '\nuserId - ' +
        userId +
        '\ndisplayName - ' +
        displayName,
    );
    this.addLog(
      'onUserBeginTyping: \nconvId - ' +
        convId +
        '\nuserId - ' +
        userId +
        '\ndisplayName - ' +
        displayName,
    );
  };

  // Receive when user send endTyping
  onUserEndTyping = (
    stringeeClient: StringeeClient,
    convId: string,
    userId: string,
    displayName: string,
  ) => {
    console.log(
      'onUserEndTyping: \nconvId - ' +
        convId +
        '\nuserId - ' +
        userId +
        '\ndisplayName - ' +
        displayName,
    );
    this.addLog(
      'onUserEndTyping: \nconvId - ' +
        convId +
        '\nuserId - ' +
        userId +
        '\ndisplayName - ' +
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
  createConversation = (
    options: ConversationOption,
    participant: Array<string>,
  ) => {
    this.stringeeClient
      .createConversation(participant, options)
      .then(conversation => {
        console.log(
          'createConversation: success \nconversation - ' +
            JSON.stringify(conversation),
        );
        this.addLog(
          'createConversation: success \nconversation - ' +
            JSON.stringify(conversation),
        );
        this.clearConversations();
        this.addConversation(conversation);
      })
      .catch(error => {
        console.log('createConversation: ', error.message);
        this.addLog('createConversation: ' + error.message);
      });
  };

  getConversationById = convId => {
    this.stringeeClient
      .getConversationById(convId)
      .then(conversation => {
        console.log(
          'getConversationById: success \nconversation - ' +
            JSON.stringify(conversation),
        );
        this.addLog(
          'getConversationById: success \nconversation - ' +
            JSON.stringify(conversation),
        );
        this.clearConversations();
        this.addConversation(conversation);
      })
      .catch(error => {
        console.log('getConversationById: ', error.message);
        this.addLog('getConversationById: ' + error.message);
      });
  };

  getLocalConversations = () => {
    const count = 10;
    const isAscending = true;

    this.stringeeClient
      .getLocalConversations(this.state.userId, count, isAscending)
      .then(conversations => {
        console.log(
          'getLocalConversations: success \nconversations - ' +
            JSON.stringify(conversations),
        );
        this.addLog(
          'getLocalConversations: success \nconversations - ' +
            JSON.stringify(conversations),
        );
        this.clearConversations();
        conversations.forEach(conversation => {
          this.addConversation(conversation);
        });
      })
      .catch(error => {
        console.log('getLocalConversations: ', error.message);
        this.addLog('getLocalConversations: ' + error.message);
      });
  };

  getLastConversations = () => {
    const count = 10;
    const isAscending = true;

    this.stringeeClient
      .getLastConversations(count, isAscending)
      .then(conversations => {
        console.log(
          'getLastConversations: success \nconversations - ' +
            JSON.stringify(conversations),
        );
        this.addLog(
          'getLastConversations: success \nconversations - ' +
            JSON.stringify(conversations),
        );
        this.clearConversations();
        conversations.forEach(conversation => {
          this.addConversation(conversation);
        });
      })
      .catch(error => {
        console.log('getLastConversations: ', error.message);
        this.addLog('getLastConversations: ' + error.message);
      });
  };

  getConversationsBefore = dateTime => {
    const count = 10;
    const isAscending = true;

    this.stringeeClient
      .getConversationsBefore(dateTime, count, isAscending)
      .then(conversations => {
        console.log(
          'getConversationsBefore: success \nconversations - ' +
            JSON.stringify(conversations),
        );
        this.addLog(
          'getConversationsBefore: success \nconversations - ' +
            JSON.stringify(conversations),
        );
        this.clearConversations();
        conversations.forEach(conversation => {
          this.addConversation(conversation);
        });
      })
      .catch(error => {
        console.log('getConversationsBefore: ', error.message);
        this.addLog('getConversationsBefore: ' + error.message);
      });
  };

  getConversationsAfter = dateTime => {
    const count = 10;
    const isAscending = true;

    this.stringeeClient
      .getConversationsAfter(dateTime, count, isAscending)
      .then(conversations => {
        console.log(
          'getConversationsAfter: success \nconversations - ' +
            JSON.stringify(conversations),
        );
        this.addLog(
          'getConversationsAfter: success \nconversations - ' +
            JSON.stringify(conversations),
        );
        this.clearConversations();
        conversations.forEach(conversation => {
          this.addConversation(conversation);
        });
      })
      .catch(error => {
        console.log('getConversationsAfter: ', error.message);
        this.addLog('getConversationsAfter: ' + error.message);
      });
  };

  getConversationWithUser = userId => {
    this.stringeeClient
      .getConversationWithUser(userId)
      .then(conversation => {
        console.log(
          'getConversationWithUser: success \nconversations - ' +
            JSON.stringify(conversation),
        );
        this.addLog(
          'getConversationWithUser: success \nconversations - ' +
            JSON.stringify(conversation),
        );
        this.clearConversations();
        this.addConversation(conversation);
      })
      .catch(error => {
        console.log('getConversationWithUser: ', error.message);
        this.addLog('getConversationWithUser: ' + error.message);
      });
  };

  getUnreadConversationCount = () => {
    this.stringeeClient
      .getUnreadConversationCount()
      .then(count => {
        console.log('getUnreadConversationCount: success \ncount - ' + count);
        this.addLog('getUnreadConversationCount: success \ncount - ' + count);
      })
      .catch(error => {
        console.log('getUnreadConversationCount: ', error.message);
        this.addLog('getUnreadConversationCount: ' + error.message);
      });
  };

  getUserInfo = (userIds: Array<string>) => {
    this.stringeeClient
      .getUserInfo(userIds)
      .then(users => {
        console.log('getUserInfo: success \nusers - ' + JSON.stringify(users));
        this.addLog('getUserInfo: success \nusers - ' + JSON.stringify(users));
      })
      .catch(error => {
        console.log('getUserInfo: ', error.message);
        this.addLog('getUserInfo: ' + error.message);
      });
  };

  updateUserInfo = (userInfo: UserInfo) => {
    this.stringeeClient
      .updateUserInfo(userInfo)
      .then(() => {
        console.log('updateUserInfo: success');
        this.addLog('updateUserInfo: success');
      })
      .catch(error => {
        console.log('updateUserInfo: ', error.message);
        this.addLog('updateUserInfo: ' + error.message);
      });
  };

  clearDb = () => {
    this.stringeeClient
      .clearDb()
      .then(() => {
        console.log('clearDb: success');
        this.addLog('clearDb: success');
      })
      .catch(error => {
        console.log('clearDb: ', error.message);
        this.addLog('clearDb: ' + error.message);
      });
  };

  deleteConversation = () => {
    this.state.selectedConv
      .deleteConversation()
      .then(() => {
        console.log('deleteConversation: success');
        this.addConversationLog('deleteConversation: success');
      })
      .catch(error => {
        console.log('deleteConversation: ', error.message);
        this.addConversationLog('deleteConversation: ' + error.message);
      });
  };

  addParticipants = participants => {
    if (this.state.selectedConv.isGroup) {
      this.state.selectedConv
        .addParticipants(participants)
        .then(users => {
          console.log(
            'addParticipants: success \nusers - ' + JSON.stringify(users),
          );
          this.addConversationLog(
            'addParticipants: success \nusers - ' + JSON.stringify(users),
          );
        })
        .catch(error => {
          console.log('addParticipants: ', error.message);
          this.addConversationLog('addParticipants: ' + error.message);
        });
    }
  };

  removeParticipants = participants => {
    if (this.state.selectedConv.isGroup) {
      this.state.selectedConv
        .removeParticipants(participants)
        .then(users => {
          console.log(
            'removeParticipants: success \nusers - ' + JSON.stringify(users),
          );
          this.addConversationLog(
            'removeParticipants: success \nusers - ' + JSON.stringify(users),
          );
        })
        .catch(error => {
          console.log('removeParticipants: ', error.message);
          this.addConversationLog('removeParticipants: ' + error.message);
        });
    }
  };

  updateConversation = conversationInfo => {
    this.state.selectedConv
      .updateConversation(conversationInfo)
      .then(() => {
        console.log('updateConversation: success');
        this.addConversationLog('updateConversation: success');
      })
      .catch(error => {
        console.log('updateConversation: ', error.message);
        this.addConversationLog('updateConversation: ' + error.message);
      });
  };

  sendBeginTyping = () => {
    this.state.selectedConv
      .sendBeginTyping()
      .then(() => {
        console.log('sendBeginTyping: success');
        this.addConversationLog('sendBeginTyping: success');
      })
      .catch(error => {
        console.log('sendBeginTyping: ', error.message);
        this.addConversationLog('sendBeginTyping: ' + error.message);
      });
  };

  sendEndTyping = () => {
    this.state.selectedConv
      .sendEndTyping()
      .then(() => {
        console.log('sendEndTyping: success');
        this.addConversationLog('sendEndTyping: success');
      })
      .catch(error => {
        console.log('sendEndTyping: ', error.message);
        this.addConversationLog('sendEndTyping: ' + error.message);
      });
  };

  sendMessage = content => {
    const newMessageInfo: NewMessageInfo = new NewMessageInfo({
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
    });
    this.state.selectedConv
      .sendMessage(newMessageInfo)
      .then(() => {
        console.log('sendMessage: success');
        this.addConversationLog('sendMessage: success');
      })
      .catch(error => {
        console.log('sendMessage: ', error.message);
        this.addConversationLog('sendMessage: ' + error.message);
      });
  };

  getLocalMessages = () => {
    const count = 10;
    const isAscending = true;

    this.state.selectedConv
      .getLocalMessages(count, isAscending)
      .then(messages => {
        console.log(
          'getLocalMessages: success \nmessages - ' + JSON.stringify(messages),
        );
        this.addConversationLog(
          'getLocalMessages: success \nmessages - ' + JSON.stringify(messages),
        );
        this.clearMsgs();
        messages.forEach(msg => {
          this.addMessage(msg);
        });
      })
      .catch(error => {
        console.log('getLocalMessages: ', error.message);
        this.addConversationLog('getLocalMessages: ' + error.message);
      });
  };

  getLastMessages = () => {
    const count = 10;
    const isAscending = true;
    const loadDeletedMessage = false;
    const loadDeletedMessageContent = false;

    this.state.selectedConv
      .getLastMessages(
        count,
        isAscending,
        loadDeletedMessage,
        loadDeletedMessageContent,
      )
      .then(messages => {
        console.log(
          'getLastMessages: success \nmessages - ' + JSON.stringify(messages),
        );
        this.addConversationLog(
          'getLastMessages: success \nmessages - ' + JSON.stringify(messages),
        );
        this.clearMsgs();
        messages.forEach(msg => {
          this.addMessage(msg);
        });
      })
      .catch(error => {
        console.log('getLastMessages: ', error.message);
        this.addConversationLog('getLastMessages: ' + error.message);
      });
  };

  getMessagesAfter = sequence => {
    const count = 10;
    const isAscending = true;
    const loadDeletedMessage = false;
    const loadDeletedMessageContent = false;

    this.state.selectedConv
      .getMessagesAfter(
        sequence,
        count,
        isAscending,
        loadDeletedMessage,
        loadDeletedMessageContent,
      )
      .then(messages => {
        console.log(
          'getMessagesAfter: success \nmessages - ' + JSON.stringify(messages),
        );
        this.addConversationLog(
          'getMessagesAfter: success \nmessages - ' + JSON.stringify(messages),
        );
        this.clearMsgs();
        messages.forEach(msg => {
          this.addMessage(msg);
        });
      })
      .catch(error => {
        console.log('getMessagesAfter: ', error.message);
        this.addConversationLog('getMessagesAfter: ' + error.message);
      });
  };

  getMessagesBefore = sequence => {
    const count = 10;
    const isAscending = true;
    const loadDeletedMessage = false;
    const loadDeletedMessageContent = false;

    this.state.selectedConv
      .getMessagesBefore(
        sequence,
        count,
        isAscending,
        loadDeletedMessage,
        loadDeletedMessageContent,
      )
      .then(messages => {
        console.log(
          'getMessagesBefore: success \nmessages - ' + JSON.stringify(messages),
        );
        this.addConversationLog(
          'getMessagesBefore: success \nmessages - ' + JSON.stringify(messages),
        );
        this.clearMsgs();
        messages.forEach(msg => {
          this.addMessage(msg);
        });
      })
      .catch(error => {
        console.log('getMessagesBefore: ', error.message);
        this.addConversationLog('getMessagesBefore: ' + error.message);
      });
  };

  getMessageById = msgId => {
    this.state.selectedConv
      .getMessageById(msgId)
      .then(message => {
        console.log(
          'getMessageById: success \nmessage - ' + JSON.stringify(message),
        );
        this.addConversationLog(
          'getMessageById: success \nmessage - ' + JSON.stringify(message),
        );
        this.clearMsgs();
        this.addMessage(message);
      })
      .catch(error => {
        console.log('getMessageById: ', error.message);
        this.addConversationLog('getMessageById: ' + error.message);
      });
  };

  markConversationAsRead = () => {
    this.state.selectedConv
      .markConversationAsRead()
      .then(() => {
        console.log('markConversationAsRead: success');
        this.addConversationLog('markConversationAsRead: success');
      })
      .catch(error => {
        console.log('markConversationAsRead: ', error.message);
        this.addConversationLog('markConversationAsRead: ' + error.message);
      });
  };

  editMessage = newContent => {
    this.state.selectedMsg
      .editMessage(newContent)
      .then(() => {
        console.log('editMessage: success');
        this.addConversationLog('editMessage: success');
      })
      .catch(error => {
        console.log('editMessage: ', error.message);
        this.addConversationLog('editMessage: ' + error.message);
      });
  };

  pinMessage = () => {
    const pin = this.state.selectedMsg.id !== this.state.selectedConv.pinMsgId;
    this.state.selectedMsg
      .pinMessage(pin)
      .then(() => {
        console.log('pinMessage: success \npin - ' + pin);
        this.addConversationLog('pinMessage: success \npin - ' + pin);
      })
      .catch(error => {
        console.log('pinMessage: ', error.message);
        this.addConversationLog('pinMessage: ' + error.message);
      });
  };

  deleteMessage = () => {
    this.state.selectedConv
      .deleteMessage(this.state.selectedMsg.id)
      .then(() => {
        console.log('deleteMessage: success');
        this.addConversationLog('deleteMessage: success');
      })
      .catch(error => {
        console.log('deleteMessage: ', error.message);
        this.addConversationLog('deleteMessage: ' + error.message);
      });
  };

  revokeMessage = () => {
    this.state.selectedConv
      .revokeMessage(this.state.selectedMsg.id)
      .then(() => {
        console.log('revokeMessage: success');
        this.addConversationLog('revokeMessage: success');
      })
      .catch(error => {
        console.log('revokeMessage: ', error.message);
        this.addConversationLog('revokeMessage: ' + error.message);
      });
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
                    this.stringeeClient
                      .getUserInfo([this.state.userId])
                      .then(users => {
                        console.log(
                          'getUserInfo: success \nusers - ' +
                            JSON.stringify(users),
                        );
                        this.addLog(
                          'getUserInfo: success \nusers - ' +
                            JSON.stringify(users),
                        );
                        this.updateUserInfoRef.current.setUserInfo(users[0]);
                        this.updateUserInfoRef.current.show();
                      })
                      .catch(error => {
                        console.log('getUserInfo: ', error.message);
                        this.addLog('getUserInfo: ' + error.message);
                      });
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
              data={conversationInfo => {
                this.updateConversation(conversationInfo);
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
                this.getMessagesAfter(parseFloat(sequence));
              }}
            />

            <ActShtGetMessage
              ref={this.getMsgBeforeRef}
              isNumber={true}
              title={'Sequence'}
              data={sequence => {
                this.getMessagesBefore(parseFloat(sequence));
              }}
            />

            <ActShtGetMessage
              ref={this.getMsgById}
              title={'Message id'}
              data={msgId => {
                this.getMessageById('msg-vn-1-WI4Y6NAP8C-1646851800851');
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
            this.getConversationById('conv-vn-1-X2IZRTJI37-1625179974320');
          }}
        />

        <ActShtGetConversation
          ref={this.getConvAfterRef}
          isNumber={true}
          title={'Time in milli second'}
          data={dateTime => {
            this.getConversationsAfter(1667277024700);
          }}
        />

        <ActShtGetConversation
          ref={this.getConvBeforeRef}
          isNumber={true}
          title={'Time in milli second'}
          data={dateTime => {
            this.getConversationsBefore(1667277024700);
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
