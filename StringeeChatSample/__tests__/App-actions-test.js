/**
 * @format
 */

import App from '../App';

jest.mock('../src/StringeeClient', () => () => null);
jest.mock('react-native-elements', () => ({
  CheckBox: () => null,
  Icon: () => null,
}));
jest.mock('react-native-actions-sheet/src/index', () => () => null);

const conversation = {
  id: 'conversation-1',
  isGroup: true,
  pinMsgId: 'other-message',
};
const message = {id: 'message-1', sequence: 10};

const withResult = result =>
  jest.fn((...args) => args[args.length - 1](true, 0, 'Success', result));

const createClient = () => ({
  connect: jest.fn(),
  createConversation: withResult(conversation),
  getConversationById: withResult(conversation),
  getLocalConversations: withResult([conversation]),
  getLastConversations: withResult([conversation]),
  getConversationsBefore: withResult([conversation]),
  getConversationsAfter: withResult([conversation]),
  getConversationWithUser: withResult(conversation),
  getUnreadConversationCount: withResult(2),
  getUserInfo: withResult([{userId: 'user-2'}]),
  updateUserInfoWithParam: withResult(undefined),
  clearDb: withResult(undefined),
  deleteConversation: withResult(undefined),
  addParticipants: withResult([{userId: 'user-2'}]),
  removeParticipants: withResult([{userId: 'user-2'}]),
  updateConversation: withResult(undefined),
  sendBeginTyping: withResult(undefined),
  sendEndTyping: withResult(undefined),
  sendMessage: withResult(undefined),
  getLocalMessages: withResult([message]),
  getLastMessages: withResult([message]),
  getMessagesAfter: withResult([message]),
  getMessagesBefore: withResult([message]),
  getMessageById: withResult(message),
  markConversationAsRead: withResult(undefined),
  editMessage: withResult(undefined),
  pinMessage: withResult(undefined),
  deleteMessage: withResult(undefined),
  revokeMessage: withResult(undefined),
});

const createApp = () => {
  const app = new App({});
  app.setState = update => {
    const nextState =
      typeof update === 'function' ? update(app.state, app.props) : update;
    app.state = {...app.state, ...nextState};
  };
  app.client.current = createClient();
  app.state = {
    ...app.state,
    userId: 'user-1',
    selectedConv: conversation,
    selectedMsg: message,
  };
  return app;
};

describe('StringeeChat App actions', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  it('handles client connection and object events', () => {
    const app = createApp();

    app.componentDidMount();
    app.onConnect({userId: 'user-1'});
    app.onFailWithError({code: 500, message: 'failed'});
    app.onRequestAccessToken();
    app.onCustomMessage({data: 'custom'});
    app.onUserBeginTyping({
      convId: 'conversation-1',
      userId: 'user-2',
      displayName: 'User 2',
    });
    app.onUserEndTyping({
      convId: 'conversation-1',
      userId: 'user-2',
      displayName: 'User 2',
    });
    app.onObjectChange({
      objectType: 1,
      objectChanges: [{...message, sequence: 11}],
      changeType: 2,
    });
    app.onObjectChange({
      objectType: 2,
      objectChanges: [{...conversation, name: 'Updated'}],
      changeType: 2,
    });
    app.onDisConnect();

    expect(app.client.current.connect).toHaveBeenCalledWith(
      'YOUR_ACCESS_TOKEN',
    );
    expect(app.state.userId).toBe('');
    expect(app.state.log).toContain('onDisConnect');
    expect(app.state.selectedMsg.sequence).toBe(11);
    expect(app.state.selectedConv.name).toBe('Updated');
  });

  it('covers conversation lookup and user operations', () => {
    const app = createApp();

    app.createConversation({name: 'Support'}, ['user-2']);
    app.getConversationById('conversation-1');
    app.getLocalConversations();
    app.getLastConversations();
    app.getConversationsBefore(1000);
    app.getConversationsAfter(2000);
    app.getConversationWithUser('user-2');
    app.getUnreadConversationCount();
    app.getUserInfo(['user-2']);
    app.updateUserInfo({displayName: 'User 1'});
    app.clearDb();

    expect(app.client.current.createConversation).toHaveBeenCalledWith(
      ['user-2'],
      {name: 'Support'},
      expect.any(Function),
    );
    expect(app.client.current.getLocalConversations).toHaveBeenCalledWith(
      'user-1',
      10,
      true,
      expect.any(Function),
    );
    expect(app.state.conversations).toEqual([conversation]);
    expect(app.state.log.length).toBeGreaterThan(0);
  });

  it('covers conversation and message mutations', () => {
    const app = createApp();

    app.deleteConversation();
    app.addParticipants(['user-2']);
    app.removeParticipants(['user-2']);
    app.updateConversation('Updated', 'avatar-url');
    app.sendBeginTyping();
    app.sendEndTyping();
    app.sendMessage('Hello');
    app.getLocalMessages();
    app.getLastMessages();
    app.getMessagesAfter(10);
    app.getMessagesBefore(10);
    app.getMessageById('message-1');
    app.markConversationAsRead();
    app.editMessage('Edited');
    app.pinMessage();
    app.state.selectedConv = {...conversation, pinMsgId: 'message-1'};
    app.pinMessage();
    app.deleteMessage();
    app.revokeMessage();

    expect(app.client.current.addParticipants).toHaveBeenCalledWith(
      'conversation-1',
      ['user-2'],
      expect.any(Function),
    );
    expect(app.client.current.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        convId: 'conversation-1',
        type: 1,
        message: expect.objectContaining({content: 'Hello'}),
      }),
      expect.any(Function),
    );
    expect(app.client.current.pinMessage).toHaveBeenNthCalledWith(
      1,
      'conversation-1',
      'message-1',
      true,
      expect.any(Function),
    );
    expect(app.client.current.pinMessage).toHaveBeenNthCalledWith(
      2,
      'conversation-1',
      'message-1',
      false,
      expect.any(Function),
    );
    expect(app.state.messages).toEqual([message]);
    expect(app.state.conversationLog.length).toBeGreaterThan(0);
  });

  it('skips participant mutations for one-to-one conversations and clears data', () => {
    const app = createApp();
    app.state.selectedConv = {...conversation, isGroup: false};

    app.addParticipants(['user-2']);
    app.removeParticipants(['user-2']);
    app.clearLog();
    app.clearConversations();
    app.clearMsgLog();
    app.clearMsgs();

    expect(app.client.current.addParticipants).not.toHaveBeenCalled();
    expect(app.client.current.removeParticipants).not.toHaveBeenCalled();
    expect(app.state.log).toEqual([]);
    expect(app.state.conversations).toEqual([]);
    expect(app.state.conversationLog).toEqual([]);
    expect(app.state.messages).toEqual([]);
  });
});
