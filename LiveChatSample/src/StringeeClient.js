import {PureComponent} from 'react';
import {StringeeClient as StringeeClientV2} from 'stringee-react-native-v2';

/**
 * Adapts the Promise/listener API of stringee-react-native-v2 to the callback
 * surface used by this legacy UI. New features should call the v2 client or
 * Conversation/Message objects directly.
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
      onCustomMessage: (_client, _from, data) =>
        handlers.onCustomMessage?.({data}),
      onObjectChange: (_client, objectType, objectChanges, changeType) =>
        handlers.onObjectChange?.({objectType, objectChanges, changeType}),
      onReceiveChatRequest: (_client, request) =>
        handlers.onReceiveChatRequest?.({request}),
      onReceiveTransferChatRequest: (_client, request) =>
        handlers.onReceiveTransferChatRequest?.({request}),
      onTimeoutAnswerChat: (_client, request) =>
        handlers.onTimeoutAnswerChat?.({request}),
      onTimeoutInQueue: (_client, convId, customerId, customerName) =>
        handlers.onTimeoutInQueue?.({convId, customerId, customerName}),
      onConversationEnded: (_client, convId, endedby) =>
        handlers.onConversationEnded?.({convId, endedby}),
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

  getChatProfile = (widgetKey, callback) =>
    this.run(this.client.getChatProfile(widgetKey), callback);

  getLiveChatToken = (widgetKey, name, email, callback) =>
    this.run(this.client.getLiveChatToken(widgetKey, name, email), callback);

  createLiveChatConversation = (queueId, callback) =>
    this.run(this.client.createLiveChatConversation(queueId), callback);

  getConversationById = (convId, callback) =>
    this.run(this.client.getConversationById(convId), callback);

  sendMessage = (message, callback) =>
    this.withConversation(message.convId, conversation =>
      conversation.sendMessage(message),
    ).then(
      () => callback?.(true, 0, 'Success'),
      error => this.fail(callback, error),
    );

  endChat = (convId, callback) =>
    this.withConversation(convId, conversation => conversation.endChat()).then(
      () => callback?.(true, 0, 'Success'),
      error => this.fail(callback, error),
    );

  acceptChatRequest = (request, callback) =>
    this.runVoid(request.acceptChatRequest(), callback);

  rejectChatRequest = (request, callback) =>
    this.runVoid(request.rejectChatRequest(), callback);

  withConversation = (convId, action) =>
    this.client.getConversationById(convId).then(action);

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
