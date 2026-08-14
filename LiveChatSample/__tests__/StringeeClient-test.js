/**
 * @format
 */

const mockConversation = {
  sendMessage: jest.fn(),
  endChat: jest.fn(),
};
const mockSdkClient = {
  setListener: jest.fn(),
  unregisterEvents: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  getChatProfile: jest.fn(),
  getLiveChatToken: jest.fn(),
  createLiveChatConversation: jest.fn(),
  getConversationById: jest.fn(),
};

jest.mock('stringee-react-native-v2', () => ({
  StringeeClient: jest.fn(() => mockSdkClient),
}));

import StringeeClient from '../src/StringeeClient';

describe('LiveChat StringeeClient adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConversation.sendMessage.mockResolvedValue(undefined);
    mockConversation.endChat.mockResolvedValue(undefined);
    mockSdkClient.getConversationById.mockResolvedValue(mockConversation);
  });

  it('maps v2 listener arguments to the legacy event payloads', () => {
    const handlers = {
      onConnect: jest.fn(),
      onDisConnect: jest.fn(),
      onFailWithError: jest.fn(),
      onRequestAccessToken: jest.fn(),
      onCustomMessage: jest.fn(),
      onObjectChange: jest.fn(),
      onReceiveChatRequest: jest.fn(),
      onReceiveTransferChatRequest: jest.fn(),
      onTimeoutAnswerChat: jest.fn(),
      onTimeoutInQueue: jest.fn(),
      onConversationEnded: jest.fn(),
      onUserBeginTyping: jest.fn(),
      onUserEndTyping: jest.fn(),
    };
    const adapter = new StringeeClient({eventHandlers: handlers});

    adapter.componentDidMount();
    const listener = mockSdkClient.setListener.mock.calls[0][0];
    const request = {convId: 'conversation-1'};

    listener.onConnect(mockSdkClient, 'agent-1');
    listener.onDisConnect(mockSdkClient);
    listener.onFailWithError(mockSdkClient, 401, 'Invalid token');
    listener.onRequestAccessToken(mockSdkClient);
    listener.onCustomMessage(mockSdkClient, 'ignored-sender', {type: 'ping'});
    listener.onObjectChange(mockSdkClient, 1, [{id: 'message-1'}], 2);
    listener.onReceiveChatRequest(mockSdkClient, request);
    listener.onReceiveTransferChatRequest(mockSdkClient, request);
    listener.onTimeoutAnswerChat(mockSdkClient, request);
    listener.onTimeoutInQueue(
      mockSdkClient,
      'conversation-1',
      'customer-1',
      'A',
    );
    listener.onConversationEnded(mockSdkClient, 'conversation-1', 'agent-1');
    listener.onUserBeginTyping(
      mockSdkClient,
      'conversation-1',
      'customer-1',
      'Customer',
    );
    listener.onUserEndTyping(
      mockSdkClient,
      'conversation-1',
      'customer-1',
      'Customer',
    );

    expect(handlers.onConnect).toHaveBeenCalledWith({userId: 'agent-1'});
    expect(handlers.onDisConnect).toHaveBeenCalledTimes(1);
    expect(handlers.onFailWithError).toHaveBeenCalledWith({
      code: 401,
      message: 'Invalid token',
    });
    expect(handlers.onCustomMessage).toHaveBeenCalledWith({
      data: {type: 'ping'},
    });
    expect(handlers.onRequestAccessToken).toHaveBeenCalledTimes(1);
    expect(handlers.onObjectChange).toHaveBeenCalledWith({
      objectType: 1,
      objectChanges: [{id: 'message-1'}],
      changeType: 2,
    });
    expect(handlers.onReceiveChatRequest).toHaveBeenCalledWith({request});
    expect(handlers.onReceiveTransferChatRequest).toHaveBeenCalledWith({
      request,
    });
    expect(handlers.onTimeoutAnswerChat).toHaveBeenCalledWith({request});
    expect(handlers.onTimeoutInQueue).toHaveBeenCalledWith({
      convId: 'conversation-1',
      customerId: 'customer-1',
      customerName: 'A',
    });
    expect(handlers.onConversationEnded).toHaveBeenCalledWith({
      convId: 'conversation-1',
      endedby: 'agent-1',
    });
    expect(handlers.onUserBeginTyping).toHaveBeenCalledWith({
      convId: 'conversation-1',
      userId: 'customer-1',
      displayName: 'Customer',
    });
    expect(handlers.onUserEndTyping).toHaveBeenCalledWith({
      convId: 'conversation-1',
      userId: 'customer-1',
      displayName: 'Customer',
    });
  });

  it('forwards direct client actions and releases native listeners', () => {
    const adapter = new StringeeClient({});

    adapter.connect('access-token');
    adapter.disconnect();
    adapter.componentWillUnmount();

    expect(mockSdkClient.connect).toHaveBeenCalledWith('access-token');
    expect(mockSdkClient.disconnect).toHaveBeenCalledTimes(2);
    expect(mockSdkClient.unregisterEvents).toHaveBeenCalledTimes(1);
  });

  it('converts a successful Promise result to the legacy callback', async () => {
    const profile = {queues: [{id: 'queue-1'}]};
    const callback = jest.fn();
    mockSdkClient.getChatProfile.mockResolvedValue(profile);
    const adapter = new StringeeClient({});

    await adapter.getChatProfile('widget-key', callback);

    expect(mockSdkClient.getChatProfile).toHaveBeenCalledWith('widget-key');
    expect(callback).toHaveBeenCalledWith(true, 0, 'Success', profile);
  });

  it('adapts all live-chat lookup and creation methods', async () => {
    const callback = jest.fn();
    const token = 'live-chat-token';
    const conversation = {id: 'conversation-1'};
    mockSdkClient.getLiveChatToken.mockResolvedValue(token);
    mockSdkClient.createLiveChatConversation.mockResolvedValue(conversation);
    mockSdkClient.getConversationById.mockResolvedValueOnce(conversation);
    const adapter = new StringeeClient({});

    await adapter.getLiveChatToken(
      'widget-key',
      'Customer',
      'customer@test.com',
      callback,
    );
    await adapter.createLiveChatConversation('queue-1', callback);
    await adapter.getConversationById('conversation-1', callback);

    expect(mockSdkClient.getLiveChatToken).toHaveBeenCalledWith(
      'widget-key',
      'Customer',
      'customer@test.com',
    );
    expect(mockSdkClient.createLiveChatConversation).toHaveBeenCalledWith(
      'queue-1',
    );
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('normalizes a rejected Promise for the legacy callback', async () => {
    const callback = jest.fn();
    mockSdkClient.getLiveChatToken.mockRejectedValue({
      code: 403,
      message: 'Widget key is invalid',
    });
    const adapter = new StringeeClient({});

    await adapter.getLiveChatToken(
      'widget-key',
      'Name',
      'mail@test.com',
      callback,
    );

    expect(callback).toHaveBeenCalledWith(false, 403, 'Widget key is invalid');
  });

  it('loads the conversation before sending a message or ending chat', async () => {
    const callback = jest.fn();
    const message = {convId: 'conversation-1', type: 1};
    const adapter = new StringeeClient({});

    await adapter.sendMessage(message, callback);
    await adapter.endChat('conversation-1', callback);

    expect(mockSdkClient.getConversationById).toHaveBeenCalledTimes(2);
    expect(mockSdkClient.getConversationById).toHaveBeenCalledWith(
      'conversation-1',
    );
    expect(mockConversation.sendMessage).toHaveBeenCalledWith(message);
    expect(mockConversation.endChat).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenNthCalledWith(1, true, 0, 'Success');
    expect(callback).toHaveBeenNthCalledWith(2, true, 0, 'Success');
  });

  it('accepts and rejects a live-chat request through the v2 object', async () => {
    const callback = jest.fn();
    const request = {
      acceptChatRequest: jest.fn().mockResolvedValue(undefined),
      rejectChatRequest: jest.fn().mockResolvedValue(undefined),
    };
    const adapter = new StringeeClient({});

    await adapter.acceptChatRequest(request, callback);
    await adapter.rejectChatRequest(request, callback);

    expect(request.acceptChatRequest).toHaveBeenCalledTimes(1);
    expect(request.rejectChatRequest).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('reports conversation action failures and supports omitted callbacks', async () => {
    const callback = jest.fn();
    mockConversation.sendMessage.mockRejectedValueOnce('send failed');
    const adapter = new StringeeClient({});

    await adapter.sendMessage({convId: 'conversation-1'}, callback);
    await adapter.run(Promise.resolve('unused'));
    await adapter.runVoid(Promise.resolve());
    adapter.fail(undefined, new Error('ignored'));

    expect(callback).toHaveBeenCalledWith(false, -1, 'send failed');
  });
});
