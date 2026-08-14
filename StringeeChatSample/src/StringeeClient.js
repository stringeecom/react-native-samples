import {PureComponent} from 'react';
import {StringeeClient as StringeeClientV2} from 'stringee-react-native-v2';

/**
 * Adapts the Promise/listener API of stringee-react-native-v2 to the callback
 * surface used by this legacy sample UI.
 */
export default class StringeeClient extends PureComponent {
  constructor(props) {
    super(props);
    this.client = new StringeeClientV2();
  }

  componentDidMount() {
    const handlers = this.props.eventHandlers || {};
    this.client.setListener({
      onConnect: (_client, userId) => handlers.onConnect?.({userId}),
      onDisConnect: () => handlers.onDisConnect?.(),
      onFailWithError: (_client, code, message) =>
        handlers.onFailWithError?.({code, message}),
      onRequestAccessToken: () => handlers.onRequestAccessToken?.(),
      onCustomMessage: (_client, from, data) =>
        handlers.onCustomMessage?.({from, data}),
      onObjectChange: (_client, objectType, objectChanges, changeType) =>
        handlers.onObjectChange?.({objectType, objectChanges, changeType}),
      onUserBeginTyping: (_client, convId, userId, displayName) =>
        handlers.onUserBeginTyping?.({convId, userId, displayName}),
      onUserEndTyping: (_client, convId, userId, displayName) =>
        handlers.onUserEndTyping?.({convId, userId, displayName}),
    });
  }

  componentWillUnmount() {
    this.client.unregisterEvents();
    this.client.disconnect();
  }

  connect = token => this.client.connect(token);
  disconnect = () => this.client.disconnect();

  createConversation = (participants, options, callback) =>
    this.run(this.client.createConversation(participants, options), callback);
  getConversationById = (convId, callback) =>
    this.run(this.client.getConversationById(convId), callback);
  getLocalConversations = (userId, count, ascending, callback) =>
    this.run(
      this.client.getLocalConversations(userId, count, ascending),
      callback,
    );
  getLastConversations = (count, ascending, callback) =>
    this.run(this.client.getLastConversations(count, ascending), callback);
  getConversationsBefore = (time, count, ascending, callback) =>
    this.run(
      this.client.getConversationsBefore(time, count, ascending),
      callback,
    );
  getConversationsAfter = (time, count, ascending, callback) =>
    this.run(
      this.client.getConversationsAfter(time, count, ascending),
      callback,
    );
  getConversationWithUser = (userId, callback) =>
    this.run(this.client.getConversationWithUser(userId), callback);
  getUnreadConversationCount = callback =>
    this.run(this.client.getUnreadConversationCount(), callback);
  getUserInfo = (userIds, callback) =>
    this.run(this.client.getUserInfo(userIds), callback);
  updateUserInfoWithParam = (userInfo, callback) =>
    this.runVoid(this.client.updateUserInfo(userInfo), callback);
  clearDb = callback => this.runVoid(this.client.clearDb(), callback);

  deleteConversation = (convId, callback) =>
    this.runConversationVoid(
      convId,
      conversation => conversation.deleteConversation(),
      callback,
    );
  addParticipants = (convId, participants, callback) =>
    this.runConversation(
      convId,
      conversation => conversation.addParticipants(participants),
      callback,
    );
  removeParticipants = (convId, participants, callback) =>
    this.runConversation(
      convId,
      conversation => conversation.removeParticipants(participants),
      callback,
    );
  updateConversation = (convId, info, callback) =>
    this.runConversationVoid(
      convId,
      conversation => conversation.updateConversation(info),
      callback,
    );
  sendBeginTyping = (convId, callback) =>
    this.runConversationVoid(
      convId,
      conversation => conversation.sendBeginTyping(),
      callback,
    );
  sendEndTyping = (convId, callback) =>
    this.runConversationVoid(
      convId,
      conversation => conversation.sendEndTyping(),
      callback,
    );
  sendMessage = (message, callback) =>
    this.runConversationVoid(
      message.convId,
      conversation => conversation.sendMessage(message),
      callback,
    );
  getLocalMessages = (convId, count, ascending, callback) =>
    this.runConversation(
      convId,
      conversation => conversation.getLocalMessages(count, ascending),
      callback,
    );
  getLastMessages = (
    convId,
    count,
    ascending,
    loadDeleted,
    loadDeletedContent,
    callback,
  ) =>
    this.runConversation(
      convId,
      conversation =>
        conversation.getLastMessages(
          count,
          ascending,
          loadDeleted,
          loadDeletedContent,
        ),
      callback,
    );
  getMessagesAfter = (
    convId,
    sequence,
    count,
    ascending,
    loadDeleted,
    loadDeletedContent,
    callback,
  ) =>
    this.runConversation(
      convId,
      conversation =>
        conversation.getMessagesAfter(
          sequence,
          count,
          ascending,
          loadDeleted,
          loadDeletedContent,
        ),
      callback,
    );
  getMessagesBefore = (
    convId,
    sequence,
    count,
    ascending,
    loadDeleted,
    loadDeletedContent,
    callback,
  ) =>
    this.runConversation(
      convId,
      conversation =>
        conversation.getMessagesBefore(
          sequence,
          count,
          ascending,
          loadDeleted,
          loadDeletedContent,
        ),
      callback,
    );
  getMessageById = (convId, messageId, callback) =>
    this.runConversation(
      convId,
      conversation => conversation.getMessageById(messageId),
      callback,
    );
  markConversationAsRead = (convId, callback) =>
    this.runConversationVoid(
      convId,
      conversation => conversation.markConversationAsRead(),
      callback,
    );
  editMessage = (convId, messageId, content, callback) =>
    this.runMessageVoid(
      convId,
      messageId,
      message => message.editMessage(content),
      callback,
    );
  pinMessage = (convId, messageId, pin, callback) =>
    this.runMessageVoid(
      convId,
      messageId,
      message => message.pinMessage(pin),
      callback,
    );
  deleteMessage = (convId, messageId, callback) =>
    this.runConversationVoid(
      convId,
      conversation => conversation.deleteMessage(messageId),
      callback,
    );
  revokeMessage = (convId, messageId, callback) =>
    this.runConversationVoid(
      convId,
      conversation => conversation.revokeMessage(messageId),
      callback,
    );

  runConversation = (convId, action, callback) =>
    this.run(this.client.getConversationById(convId).then(action), callback);
  runConversationVoid = (convId, action, callback) =>
    this.runVoid(
      this.client.getConversationById(convId).then(action),
      callback,
    );
  runMessageVoid = (convId, messageId, action, callback) =>
    this.runVoid(
      this.client
        .getConversationById(convId)
        .then(conversation => conversation.getMessageById(messageId))
        .then(action),
      callback,
    );
  run = (promise, callback) =>
    promise.then(
      result => callback?.(true, 0, 'Success', result),
      error => this.fail(callback, error),
    );
  runVoid = (promise, callback) =>
    promise.then(
      () => callback?.(true, 0, 'Success'),
      error => this.fail(callback, error),
    );
  fail = (callback, error) =>
    callback?.(false, error?.code ?? -1, error?.message ?? String(error));

  render() {
    return null;
  }
}
