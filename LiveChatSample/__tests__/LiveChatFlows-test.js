/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text, TextInput} from 'react-native';
import Customer from '../src/Customer';
import Agent from '../src/Agent';

const mockClient = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  getChatProfile: jest.fn(),
  getLiveChatToken: jest.fn(),
  createLiveChatConversation: jest.fn(),
  sendMessage: jest.fn(),
  endChat: jest.fn(),
  acceptChatRequest: jest.fn(),
  rejectChatRequest: jest.fn(),
  getConversationById: jest.fn(),
};

jest.mock('../src/StringeeClient', () => {
  const ReactModule = require('react');

  /** Imperative Stringee client mock shared by the flow tests. */
  return class MockStringeeClient extends ReactModule.Component {
    render() {
      return null;
    }

    connect = mockClient.connect;
    disconnect = mockClient.disconnect;
    getChatProfile = mockClient.getChatProfile;
    getLiveChatToken = mockClient.getLiveChatToken;
    createLiveChatConversation = mockClient.createLiveChatConversation;
    sendMessage = mockClient.sendMessage;
    endChat = mockClient.endChat;
    acceptChatRequest = mockClient.acceptChatRequest;
    rejectChatRequest = mockClient.rejectChatRequest;
    getConversationById = mockClient.getConversationById;
  };
});

import renderer from 'react-test-renderer';

const press = (tree, label) => {
  const text = tree.root
    .findAllByType(Text)
    .find(node => node.props.children === label);
  let pressable = text;
  while (pressable && typeof pressable.props.onPress !== 'function') {
    pressable = pressable.parent;
  }
  renderer.act(() => pressable.props.onPress());
};

describe('live-chat customer and agent flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    mockClient.getChatProfile.mockImplementation((_key, callback) =>
      callback(true, 0, 'Success', {
        queues: [{id: 'queue-0'}, {id: 'queue-1'}],
      }),
    );
    mockClient.getLiveChatToken.mockImplementation(
      (_key, _name, _email, callback) =>
        callback(true, 0, 'Success', 'live-chat-token'),
    );
    mockClient.createLiveChatConversation.mockImplementation(
      (_queueId, callback) =>
        callback(true, 0, 'Success', {id: 'conversation-1'}),
    );
    mockClient.sendMessage.mockImplementation((_message, callback) =>
      callback(true, 0, 'Success'),
    );
    mockClient.endChat.mockImplementation((_convId, callback) =>
      callback(true, 0, 'Success'),
    );
    mockClient.acceptChatRequest.mockImplementation((_request, callback) =>
      callback(true, 0, 'Success'),
    );
    mockClient.rejectChatRequest.mockImplementation((_request, callback) =>
      callback(true, 0, 'Success'),
    );
    mockClient.getConversationById.mockImplementation((_convId, callback) =>
      callback(true, 0, 'Success', {id: 'conversation-1'}),
    );
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  it('covers the customer connect, conversation, message and event flow', () => {
    let tree;
    renderer.act(() => {
      tree = renderer.create(<Customer />);
    });
    const instance = tree.getInstance();
    const inputs = tree.root.findAllByType(TextInput);

    renderer.act(() => {
      inputs[0].props.onChangeText('Customer');
      inputs[1].props.onChangeText('customer@test.com');
    });
    press(tree, 'Connect');
    expect(mockClient.connect).toHaveBeenCalledWith('live-chat-token');

    renderer.act(() => instance.onConnect({userId: 'customer-1'}));
    press(tree, 'Create live-chat');
    press(tree, 'Send message');
    press(tree, 'End chat');

    renderer.act(() => {
      instance.onFailWithError({code: 500, message: 'failed'});
      instance.onRequestAccessToken();
      instance.onCustomMessage({data: 'custom'});
      instance.onObjectChange({
        objectType: 1,
        objectChanges: [{id: 'message-1'}],
        changeType: 2,
      });
      instance.onTimeoutInQueue({
        convId: 'conversation-1',
        customerId: 'customer-1',
        customerName: 'Customer',
      });
      instance.onConversationEnded({
        convId: 'conversation-1',
        endedby: 'agent-1',
      });
      instance.onUserBeginTyping({
        convId: 'conversation-1',
        userId: 'agent-1',
        displayName: 'Agent',
      });
      instance.onUserEndTyping({
        convId: 'conversation-1',
        userId: 'agent-1',
        displayName: 'Agent',
      });
      instance.onDisConnect();
    });

    expect(mockClient.createLiveChatConversation).toHaveBeenCalledWith(
      'queue-1',
      expect.any(Function),
    );
    expect(mockClient.sendMessage).toHaveBeenCalledTimes(1);
    expect(mockClient.endChat).toHaveBeenCalledWith(
      'conversation-1',
      expect.any(Function),
    );
    expect(instance.state.userId).toBe('Disconnected');
    renderer.act(() => tree.unmount());
  });

  it('covers agent request acceptance, rejection and conversation events', () => {
    let tree;
    renderer.act(() => {
      tree = renderer.create(<Agent />);
    });
    const instance = tree.getInstance();
    const request = {convId: 'conversation-1'};

    expect(mockClient.connect).toHaveBeenCalledWith('YOUR_ACCESS_TOKEN');
    renderer.act(() => instance.onConnect({userId: 'agent-1'}));
    renderer.act(() => instance.onReceiveChatRequest({request}));
    press(tree, 'Accept');
    press(tree, 'Send message');
    press(tree, 'End chat');

    renderer.act(() => instance.onReceiveTransferChatRequest({request}));
    press(tree, 'Reject');
    renderer.act(() => {
      instance.onReceiveChatRequest({request});
      instance.onTimeoutAnswerChat({request});
      instance.onFailWithError({code: 401, message: 'invalid'});
      instance.onRequestAccessToken();
      instance.onCustomMessage({data: 'custom'});
      instance.onObjectChange({
        objectType: 2,
        objectChanges: [{id: 'conversation-1'}],
        changeType: 1,
      });
      instance.onConversationEnded({
        convId: 'conversation-1',
        endedby: 'customer-1',
      });
      instance.onUserBeginTyping({
        convId: 'conversation-1',
        userId: 'customer-1',
        displayName: 'Customer',
      });
      instance.onUserEndTyping({
        convId: 'conversation-1',
        userId: 'customer-1',
        displayName: 'Customer',
      });
      instance.onDisConnect();
    });

    expect(mockClient.acceptChatRequest).toHaveBeenCalledWith(
      request,
      expect.any(Function),
    );
    expect(mockClient.rejectChatRequest).toHaveBeenCalledWith(
      request,
      expect.any(Function),
    );
    expect(mockClient.getConversationById).toHaveBeenCalledWith(
      'conversation-1',
      expect.any(Function),
    );
    expect(instance.state.userId).toBe('Disconnected');
    renderer.act(() => tree.unmount());
  });
});
