import React, {Component} from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {StringeeClient} from 'stringee-react-native';

const user1 =
  'eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTS0UxUmRVdFVhWXhOYVFRNFdyMTVxRjF6VUp1UWRBYVZULTE2MzE0OTgyNTgiLCJpc3MiOiJTS0UxUmRVdFVhWXhOYVFRNFdyMTVxRjF6VUp1UWRBYVZUIiwiZXhwIjoxNjM0MDkwMjU4LCJ1c2VySWQiOiJ1c2VyMSJ9.I_XciSUGpAwnsJmCDQ2ViLV8osdlF0qIuMuhAExYOIE';

export default class HomeScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      myUserId: '',
      content: '',
      hasConnected: false,
      convId: '',
      dateTime: 0,
      sequence: 0,
    };

    this.clientEventHandlers = {
      onConnect: this._clientDidConnect,
      onDisConnect: this._clientDidDisConnect,
      onFailWithError: this._clientDidFailWithError,
      onRequestAccessToken: this._clientRequestAccessToken,
      onIncomingCall: this._callIncomingCall,
      onObjectChange: this.onObjectChange,
    };
  }

  componentWillMount() {}

  async componentDidMount() {
    await this.refs.client.connect(user1);
  }

  // Connection
  _clientDidConnect = ({userId}) => {
    console.log('_clientDidConnect - ' + userId);
    // Load thử conversation

    this.setState({
      myUserId: userId,
      hasConnected: true,
    });
  };

  _clientDidDisConnect = ({userId}) => {
    console.log('_clientDidDisConnect - ' + userId);
    this.setState({
      myUserId: '',
      hasConnected: false,
    });
  };

  _clientDidFailWithError = () => {
    console.log('_clientDidFailWithError');
  };

  _clientRequestAccessToken = () => {
    console.log('_clientRequestAccessToken');
    // Token để kết nối tới Stringee server đã hết bạn. Bạn cần lấy token mới và gọi connect lại ở đây
    // this.refs.client.connect("NEW_TOKEN");
  };

  // Call events
  _callIncomingCall = ({
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
      'IncomingCallId-' +
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
      from: from,
      to: to,
      isOutgoingCall: false,
      isVideoCall: isVideoCall,
    });
  };

  onObjectChange = ({objectType, objectChanges, changeType}) => {
    console.log(
      'objectType' +
        objectType +
        '\n changeType' +
        changeType +
        '\n objectChanges' +
        JSON.stringify(objectChanges),
    );
  };

  // Actions
  createConversationTapped = () => {
    console.log('createConversationTapped');
    var options = {
      name: 'React-Native Group10',
      isDistinct: true,
      isGroup: false,
    };

    var userIds = ['user100', 'user105'];
    this.refs.client.createConversation(
      userIds,
      options,
      (status, code, message, conversation) => {
        console.log(
          'status-' +
            status +
            ' code-' +
            code +
            ' message-' +
            message +
            ' conversation-' +
            JSON.stringify(conversation),
        );
      },
    );
  };

  loadLocalConversationTapped = () => {
    console.log('loadLocalConversationTapped');
    var count = 50;
    var isAscending = false;

    this.refs.client.getLocalConversations(
      this.state.myUserId,
      count,
      isAscending,
      (status, code, message, conversations) => {
        console.log(
          'status-' + status + ' code-' + code + ' message-' + message,
        );

        console.log('Conversations == ' + JSON.stringify(conversations));

        conversations.map(conversation => {
          if (conversation.id != '') {
            this.setState({
              convId: conversation.id,
              dateTime: conversation.updatedAt,
            });
          }
          // console.log("conversation - Iden - " + conversation.id + "===== " +conversation.name);
          conversation.participants.map(user => {
            // console.log("Part - UserId - " + user.userId);
          });
        });
      },
    );
  };

  loadLastConversationTapped = () => {
    console.log('loadLastConversationTapped');
    var count = 50;
    var isAscending = false;

    this.refs.client.getLastConversations(
      count,
      isAscending,
      (status, code, message, conversations) => {
        console.log(
          ' status-' + status + ' code-' + code + ' message-' + message,
        );

        console.log(
          'getLastConversations -- Conversations == ' +
            JSON.stringify(conversations),
        );

        conversations.map(conversation => {
          if (conversation.id != '') {
            this.setState({
              convId: conversation.id,
              dateTime: conversation.updatedAt,
            });
          }
          // console.log("conversation - Iden - " + conversation.id + "===== " +conversation.name + "lastMsgId" + "===" + conversation.lastMsgId);
          conversation.participants.map(user => {
            // console.log("Part - UserId - " + user.userId);
          });
        });
      },
    );
  };

  loadConversationBeforeTapped = () => {
    console.log('loadConversationBeforeTapped');
    var count = 50;
    var isAscending = false;

    if (this.state.dateTime > 0) {
      this.refs.client.getConversationsBefore(
        1551235459398,
        count,
        isAscending,
        (status, code, message, conversations) => {
          console.log(
            'status-' + status + ' code-' + code + ' message-' + message,
          );

          console.log('Conversations == ' + JSON.stringify(conversations));

          conversations.map(conversation => {
            if (conversation.id != '') {
              this.setState({
                convId: conversation.id,
              });
            }
            // console.log("conversation - Iden - " + conversation.id + "===== " +conversation.name);
            conversation.participants.map(user => {
              // console.log("Part - UserId - " + user.userId);
            });
          });
        },
      );
    }
  };

  loadConversationAfterTapped = () => {
    console.log('loadConversationAfterTapped');
    var count = 50;
    var isAscending = false;

    if (this.state.dateTime > 0) {
      this.refs.client.getConversationsAfter(
        1551235459398,
        count,
        isAscending,
        (status, code, message, conversations) => {
          console.log(
            'status-' + status + ' code-' + code + ' message-' + message,
          );

          console.log('Conversations == ' + JSON.stringify(conversations));

          conversations.map(conversation => {
            if (conversation.id != '') {
              this.setState({
                convId: conversation.id,
              });
            }
            // console.log("conversation - Iden - " + conversation.id + "===== " +conversation.name);
            conversation.participants.map(user => {
              // console.log("Part - UserId - " + user.userId);
            });
          });
        },
      );
    }
  };

  loadLocalMessagesTapped = () => {
    console.log('loadLocalMessagesTapped');
    var count = 50;
    var isAscending = false;

    this.refs.client.getLocalMessages(
      'conv-vn-1-NPN1PHYU8X-1550877232011',
      count,
      isAscending,
      (status, code, message, messages) => {
        console.log(
          'status-' + status + ' code-' + code + ' message-' + message,
        );

        console.log('Messages == ' + JSON.stringify(messages));

        messages.map(message => {
          this.setState({
            sequence: message.sequence,
          });
          // console.log("Message's Id" + message.id + "Message's localId" + message.localId + "==== " + message.text);
        });
      },
    );
  };

  loadLastMessagesTapped = () => {
    console.log('loadLastMessagesTapped');
    var count = 50;
    var isAscending = false;

    this.refs.client.getLastMessages(
      'conv-vn-1-NPN1PHYU8X-1550877232011',
      count,
      isAscending,
      true,
      true,
      (status, code, message, messages) => {
        console.log(
          'status-' + status + ' code-' + code + ' message-' + message,
        );

        console.log('Messages == ' + JSON.stringify(messages));

        messages.map(message => {
          this.setState({
            sequence: message.sequence,
          });
          // console.log("Message's Id" + message.id + "==== " + message.text + " ==== " + message.type);
        });
      },
    );
  };

  loadMessagesBeforeTapped = () => {
    console.log('loadMessagesBeforeTapped');
    var count = 1;
    var isAscending = false;

    this.refs.client.getMessagesBefore(
      'conv-vn-1-NPN1PHYU8X-1550877232011',
      30,
      count,
      isAscending,
      true,
      true,
      (status, code, message, messages) => {
        console.log(
          'status-' + status + ' code-' + code + ' message-' + message,
        );

        console.log('Messages == ' + JSON.stringify(messages));
      },
    );
  };

  loadMessagesAfterTapped = () => {
    console.log('loadMessagesAfterTapped');
    var count = 30;
    var isAscending = false;

    this.refs.client.getMessagesAfter(
      'conv-vn-1-NPN1PHYU8X-1550877232011',
      1,
      count,
      isAscending,
      true,
      true,
      (status, code, message, messages) => {
        console.log(
          'status-' + status + ' code-' + code + ' message-' + message,
        );

        console.log('Messages == ' + JSON.stringify(messages));
      },
    );
  };

  sendMessageDemo = () => {
    console.log('sendMessageDemo');
    const message = {
      message: {
        content: this.state.content,

        photo: {
          filePath:
            'https://znews-photo.zadn.vn/w660/Uploaded/cqdhmdxwp/2019_09_28/actressquynhkool_71224195_398817657475073_1378833630087966795_n.jpg',
          thumbnail: '',
          ratio: 1,
        },

        video: {
          filePath: 'https://www.youtube.com/watch?v=EngW7tLk6R8',
          thumbnail: '',
          ratio: 1,
          duration: 20,
        },

        audio: {
          filePath:
            'http://www.evidenceaudio.com/wp-content/uploads/2014/10/lyricslap.mp3',
          duration: 20,
        },

        file: {
          filePath: 'https://www.w3.org/TR/PNG/iso_8859-1.txt',
          filename: 'Test file',
          length: 20000,
        },

        location: {
          lat: 21.003465,
          lon: 105.822619,
        },

        contact: {
          vcard: 'vcard demo',
        },
      },
      type: 1,
      convId: 'conv-vn-1-UWNPG461IU-1582821291249',
    };
    // const message = JSON.stringify(myObj);

    this.refs.client.sendMessage(message, (status, code, message) => {
      console.log('status-' + status + ' code-' + code + ' message-' + message);
    });
  };

  getConversationById = () => {
    this.refs.client.getConversationById(
      '',
      (status, code, message, conversation) => {
        console.log('Conversation == ' + JSON.stringify(conversation));
      },
    );
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Đang đăng nhập: {this.state.myUserId}
        </Text>

        <TextInput
          underlineColorAndroid="transparent"
          style={styles.input}
          autoCapitalize="none"
          value={this.state.content}
          placeholder="Make a call to userId"
          onChangeText={text => this.setState({content: text})}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={this.createConversationTapped}>
          <Text style={styles.text}>Create conversation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={this.loadLocalConversationTapped}>
          <Text style={styles.text}>Load Local Conversations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={this.loadLastConversationTapped}>
          <Text style={styles.text}>Load Last Conversations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={this.loadConversationBeforeTapped}>
          <Text style={styles.text}>Load Conversation Before</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={this.loadConversationAfterTapped}>
          <Text style={styles.text}>Load Conversation After</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={this.loadLocalMessagesTapped}>
          <Text style={styles.text}>Load Local Msg</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={this.loadLastMessagesTapped}>
          <Text style={styles.text}>Load Last Msg</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={this.loadMessagesBeforeTapped}>
          <Text style={styles.text}>Load Msg Before</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={this.loadMessagesAfterTapped}>
          <Text style={styles.text}>Load Msg After</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={this.sendMessageDemo}>
          <Text style={styles.text}> Send message demo </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={this.getConversationById}>
          <Text style={styles.text}> Get ConversationById</Text>
        </TouchableOpacity>

        <StringeeClient ref="client" eventHandlers={this.clientEventHandlers} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  button: {
    textAlign: 'center',
    width: 250,
    height: 40,
    marginTop: 15,
    paddingTop: 10,
    // paddingBottom: ,
    backgroundColor: '#1E6738',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },

  input: {
    height: 35,
    width: 280,
    borderWidth: 1,
    borderRadius: 5,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: '#ECECEC',
  },

  buttonView: {
    width: 280,
    height: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
