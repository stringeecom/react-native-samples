/**
 * @format
 */

const mockMessage = {
  editMessage: jest.fn(),
  pinMessage: jest.fn(),
};
const mockConversation = {
  deleteConversation: jest.fn(),
  addParticipants: jest.fn(),
  removeParticipants: jest.fn(),
  updateConversation: jest.fn(),
  sendBeginTyping: jest.fn(),
  sendEndTyping: jest.fn(),
  sendMessage: jest.fn(),
  getLocalMessages: jest.fn(),
  getLastMessages: jest.fn(),
  getMessagesAfter: jest.fn(),
  getMessagesBefore: jest.fn(),
  getMessageById: jest.fn(),
  markConversationAsRead: jest.fn(),
  deleteMessage: jest.fn(),
  revokeMessage: jest.fn(),
};
const mockSdkClient = {
  setListener: jest.fn(),
  unregisterEvents: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  createConversation: jest.fn(),
  getConversationById: jest.fn(),
  getLocalConversations: jest.fn(),
  getLastConversations: jest.fn(),
  getConversationsBefore: jest.fn(),
  getConversationsAfter: jest.fn(),
  getConversationWithUser: jest.fn(),
  getUnreadConversationCount: jest.fn(),
  getUserInfo: jest.fn(),
  updateUserInfo: jest.fn(),
  clearDb: jest.fn(),
};

jest.mock('stringee-react-native-v2', () => ({
  StringeeClient: jest.fn(() => mockSdkClient),
}));

import StringeeClient from '../src/StringeeClient';

describe('StringeeChat StringeeClient adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConversation.deleteConversation.mockResolvedValue(undefined);
    mockConversation.addParticipants.mockResolvedValue([]);
    mockConversation.removeParticipants.mockResolvedValue([]);
    mockConversation.updateConversation.mockResolvedValue(undefined);
    mockConversation.sendBeginTyping.mockResolvedValue(undefined);
    mockConversation.sendEndTyping.mockResolvedValue(undefined);
    mockConversation.sendMessage.mockResolvedValue(undefined);
    mockConversation.getLocalMessages.mockResolvedValue([]);
    mockConversation.getLastMessages.mockResolvedValue([]);
    mockConversation.getMessagesAfter.mockResolvedValue([]);
    mockConversation.getMessagesBefore.mockResolvedValue([]);
    mockConversation.getMessageById.mockResolvedValue(mockMessage);
    mockConversation.markConversationAsRead.mockResolvedValue(undefined);
    mockConversation.deleteMessage.mockResolvedValue(undefined);
    mockConversation.revokeMessage.mockResolvedValue(undefined);
    mockMessage.editMessage.mockResolvedValue(undefined);
    mockMessage.pinMessage.mockResolvedValue(undefined);
    mockSdkClient.getConversationById.mockResolvedValue(mockConversation);
  });

  it('maps v2 listener arguments to legacy event payloads', () => {
    const handlers = {
      onConnect: jest.fn(),
      onDisConnect: jest.fn(),
      onFailWithError: jest.fn(),
      onRequestAccessToken: jest.fn(),
      onCustomMessage: jest.fn(),
      onObjectChange: jest.fn(),
      onUserBeginTyping: jest.fn(),
      onUserEndTyping: jest.fn(),
    };
    const adapter = new StringeeClient({eventHandlers: handlers});

    adapter.componentDidMount();
    const listener = mockSdkClient.setListener.mock.calls[0][0];

    listener.onConnect(mockSdkClient, 'user-1');
    listener.onDisConnect(mockSdkClient);
    listener.onFailWithError(mockSdkClient, 500, 'Connection failed');
    listener.onRequestAccessToken(mockSdkClient);
    listener.onCustomMessage(mockSdkClient, 'user-2', {type: 'custom'});
    listener.onObjectChange(mockSdkClient, 1, [{id: 'message-1'}], 2);
    listener.onUserBeginTyping(
      mockSdkClient,
      'conversation-1',
      'user-2',
      'User 2',
    );
    listener.onUserEndTyping(
      mockSdkClient,
      'conversation-1',
      'user-2',
      'User 2',
    );

    expect(handlers.onConnect).toHaveBeenCalledWith({userId: 'user-1'});
    expect(handlers.onDisConnect).toHaveBeenCalledTimes(1);
    expect(handlers.onFailWithError).toHaveBeenCalledWith({
      code: 500,
      message: 'Connection failed',
    });
    expect(handlers.onRequestAccessToken).toHaveBeenCalledTimes(1);
    expect(handlers.onCustomMessage).toHaveBeenCalledWith({
      from: 'user-2',
      data: {type: 'custom'},
    });
    expect(handlers.onObjectChange).toHaveBeenCalledWith({
      objectType: 1,
      objectChanges: [{id: 'message-1'}],
      changeType: 2,
    });
    expect(handlers.onUserBeginTyping).toHaveBeenCalledWith({
      convId: 'conversation-1',
      userId: 'user-2',
      displayName: 'User 2',
    });
    expect(handlers.onUserEndTyping).toHaveBeenCalledWith({
      convId: 'conversation-1',
      userId: 'user-2',
      displayName: 'User 2',
    });
  });

  it('forwards direct connection operations', () => {
    const adapter = new StringeeClient({});

    adapter.connect('access-token');
    adapter.disconnect();

    expect(mockSdkClient.connect).toHaveBeenCalledWith('access-token');
    expect(mockSdkClient.disconnect).toHaveBeenCalledTimes(1);
  });

  it('forwards client operations and adapts result callbacks', async () => {
    const callback = jest.fn();
    const conversation = {id: 'conversation-1'};
    mockSdkClient.createConversation.mockResolvedValue(conversation);
    mockSdkClient.getConversationById.mockResolvedValue(conversation);
    mockSdkClient.getLastConversations.mockResolvedValue([conversation]);
    const adapter = new StringeeClient({});

    await adapter.createConversation(['user-2'], {name: 'Support'}, callback);
    await adapter.getConversationById('conversation-1', callback);
    await adapter.getLastConversations(10, true, callback);

    expect(mockSdkClient.createConversation).toHaveBeenCalledWith(['user-2'], {
      name: 'Support',
    });
    expect(mockSdkClient.getLastConversations).toHaveBeenCalledWith(10, true);
    expect(callback).toHaveBeenNthCalledWith(
      1,
      true,
      0,
      'Success',
      conversation,
    );
    expect(callback).toHaveBeenNthCalledWith(
      2,
      true,
      0,
      'Success',
      conversation,
    );
    expect(callback).toHaveBeenNthCalledWith(3, true, 0, 'Success', [
      conversation,
    ]);
  });

  it('loads the conversation before conversation-level operations', async () => {
    const callback = jest.fn();
    const adapter = new StringeeClient({});
    const message = {convId: 'conversation-1', type: 1};

    await adapter.addParticipants('conversation-1', ['user-2'], callback);
    await adapter.sendMessage(message, callback);
    await adapter.getLastMessages(
      'conversation-1',
      20,
      false,
      true,
      false,
      callback,
    );

    expect(mockConversation.addParticipants).toHaveBeenCalledWith(['user-2']);
    expect(mockConversation.sendMessage).toHaveBeenCalledWith(message);
    expect(mockConversation.getLastMessages).toHaveBeenCalledWith(
      20,
      false,
      true,
      false,
    );
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('adapts all conversation query methods', async () => {
    const callback = jest.fn();
    const conversations = [{id: 'conversation-1'}];
    mockSdkClient.getLocalConversations.mockResolvedValue(conversations);
    mockSdkClient.getConversationsBefore.mockResolvedValue(conversations);
    mockSdkClient.getConversationsAfter.mockResolvedValue(conversations);
    mockSdkClient.getConversationWithUser.mockResolvedValue(conversations[0]);
    mockSdkClient.getUnreadConversationCount.mockResolvedValue(2);
    mockSdkClient.getUserInfo.mockResolvedValue([{userId: 'user-2'}]);
    mockSdkClient.updateUserInfo.mockResolvedValue(undefined);
    mockSdkClient.clearDb.mockResolvedValue(undefined);
    const adapter = new StringeeClient({});

    await adapter.getLocalConversations('user-1', 10, true, callback);
    await adapter.getConversationsBefore(1000, 10, false, callback);
    await adapter.getConversationsAfter(2000, 20, true, callback);
    await adapter.getConversationWithUser('user-2', callback);
    await adapter.getUnreadConversationCount(callback);
    await adapter.getUserInfo(['user-2'], callback);
    await adapter.updateUserInfoWithParam({displayName: 'User 1'}, callback);
    await adapter.clearDb(callback);

    expect(mockSdkClient.getLocalConversations).toHaveBeenCalledWith(
      'user-1',
      10,
      true,
    );
    expect(mockSdkClient.getConversationsBefore).toHaveBeenCalledWith(
      1000,
      10,
      false,
    );
    expect(mockSdkClient.getConversationsAfter).toHaveBeenCalledWith(
      2000,
      20,
      true,
    );
    expect(mockSdkClient.getConversationWithUser).toHaveBeenCalledWith(
      'user-2',
    );
    expect(callback).toHaveBeenCalledTimes(8);
  });

  it('adapts every conversation mutation', async () => {
    const callback = jest.fn();
    const adapter = new StringeeClient({});

    await adapter.deleteConversation('conversation-1', callback);
    await adapter.removeParticipants('conversation-1', ['user-2'], callback);
    await adapter.updateConversation(
      'conversation-1',
      {name: 'Updated'},
      callback,
    );
    await adapter.sendBeginTyping('conversation-1', callback);
    await adapter.sendEndTyping('conversation-1', callback);
    await adapter.markConversationAsRead('conversation-1', callback);
    await adapter.deleteMessage('conversation-1', 'message-1', callback);
    await adapter.revokeMessage('conversation-1', 'message-1', callback);

    expect(mockConversation.deleteConversation).toHaveBeenCalledTimes(1);
    expect(mockConversation.removeParticipants).toHaveBeenCalledWith([
      'user-2',
    ]);
    expect(mockConversation.updateConversation).toHaveBeenCalledWith({
      name: 'Updated',
    });
    expect(mockConversation.sendBeginTyping).toHaveBeenCalledTimes(1);
    expect(mockConversation.sendEndTyping).toHaveBeenCalledTimes(1);
    expect(mockConversation.markConversationAsRead).toHaveBeenCalledTimes(1);
    expect(mockConversation.deleteMessage).toHaveBeenCalledWith('message-1');
    expect(mockConversation.revokeMessage).toHaveBeenCalledWith('message-1');
    expect(callback).toHaveBeenCalledTimes(8);
  });

  it('adapts all message query variants', async () => {
    const callback = jest.fn();
    const adapter = new StringeeClient({});

    await adapter.getLocalMessages('conversation-1', 10, true, callback);
    await adapter.getMessagesAfter(
      'conversation-1',
      5,
      10,
      false,
      true,
      false,
      callback,
    );
    await adapter.getMessagesBefore(
      'conversation-1',
      5,
      10,
      true,
      false,
      true,
      callback,
    );
    await adapter.getMessageById('conversation-1', 'message-1', callback);

    expect(mockConversation.getLocalMessages).toHaveBeenCalledWith(10, true);
    expect(mockConversation.getMessagesAfter).toHaveBeenCalledWith(
      5,
      10,
      false,
      true,
      false,
    );
    expect(mockConversation.getMessagesBefore).toHaveBeenCalledWith(
      5,
      10,
      true,
      false,
      true,
    );
    expect(callback).toHaveBeenCalledTimes(4);
  });

  it('loads the message before editing and pinning it', async () => {
    const callback = jest.fn();
    const adapter = new StringeeClient({});

    await adapter.editMessage(
      'conversation-1',
      'message-1',
      'Edited',
      callback,
    );
    await adapter.pinMessage('conversation-1', 'message-1', true, callback);

    expect(mockConversation.getMessageById).toHaveBeenCalledTimes(2);
    expect(mockConversation.getMessageById).toHaveBeenCalledWith('message-1');
    expect(mockMessage.editMessage).toHaveBeenCalledWith('Edited');
    expect(mockMessage.pinMessage).toHaveBeenCalledWith(true);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('normalizes errors without a Stringee error code', async () => {
    const callback = jest.fn();
    mockSdkClient.clearDb.mockRejectedValue(new Error('Cannot clear database'));
    const adapter = new StringeeClient({});

    await adapter.clearDb(callback);

    expect(callback).toHaveBeenCalledWith(false, -1, 'Cannot clear database');
  });

  it('supports callbacks being omitted for successful and failed operations', async () => {
    const adapter = new StringeeClient({});

    await adapter.run(Promise.resolve('unused'));
    await adapter.runVoid(Promise.resolve());
    adapter.fail(undefined, new Error('ignored'));

    expect(mockSdkClient.getConversationById).not.toHaveBeenCalled();
  });

  it('unregisters native events and disconnects on unmount', () => {
    const adapter = new StringeeClient({});

    adapter.componentWillUnmount();

    expect(mockSdkClient.unregisterEvents).toHaveBeenCalledTimes(1);
    expect(mockSdkClient.disconnect).toHaveBeenCalledTimes(1);
  });
});
