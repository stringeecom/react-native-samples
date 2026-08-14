/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Alert, Text, TextInput, TouchableOpacity, View} from 'react-native';
import ActShtCreateConversation from '../src/ActShtCreateConversation';
import ActShtGetConversation from '../src/ActShtGetConversation';
import ActShtGetMessage from '../src/ActShtGetMessage';
import ActShtGetUserInfo from '../src/ActShtGetUserInfo';
import ActShtMsgAction from '../src/ActShtMsgAction';
import ActShtParticipant from '../src/ActShtParticipant';
import ActShtSendMsg from '../src/ActShtSendMsg';
import ActShtUpdateConversation from '../src/ActShtUpdateConversation';
import ActShtUpdateUserInfo from '../src/ActShtUpdateUserInfo';

const mockShow = jest.fn();
const mockHide = jest.fn();

jest.mock('react-native-actions-sheet/src/index', () => {
  const ReactModule = require('react');
  const {View: NativeView} = require('react-native');

  return ReactModule.forwardRef(({children, onClose}, ref) => {
    ReactModule.useImperativeHandle(ref, () => ({
      show: mockShow,
      hide: mockHide,
    }));
    return <NativeView onClose={onClose}>{children}</NativeView>;
  });
});

jest.mock('react-native-elements', () => {
  const {TouchableOpacity: NativeTouchableOpacity} = require('react-native');

  return {
    CheckBox: ({title, onPress}) => (
      <NativeTouchableOpacity accessibilityLabel={title} onPress={onPress} />
    ),
  };
});

jest.mock('stringee-react-native-v2', () => ({
  /** Mutable user-info DTO used by the update form. */
  UserInfo: class MockUserInfo {},
}));

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

const changeInput = (tree, placeholder, value) => {
  const input = tree.root
    .findAllByType(TextInput)
    .find(node => node.props.placeholder === placeholder);
  renderer.act(() => input.props.onChangeText(value));
};

const renderSheet = (Component, props) => {
  let tree;
  renderer.act(() => {
    tree = renderer.create(<Component {...props} />);
  });
  return tree;
};

describe('StringeeChat action sheets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    Alert.alert.mockRestore();
  });

  it.each([
    [ActShtGetConversation, 'Conversation id', false],
    [ActShtGetMessage, 'Sequence', true],
  ])('submits a value from %p', (Component, title, isNumber) => {
    const data = jest.fn();
    const tree = renderSheet(Component, {title, isNumber, data});
    const instance = tree.getInstance();

    renderer.act(() => instance.show());
    changeInput(tree, title, 'value-1');
    press(tree, 'Get');

    expect(mockShow).toHaveBeenCalledTimes(1);
    expect(mockHide).toHaveBeenCalledTimes(1);
    expect(data).toHaveBeenCalledWith('value-1');
    expect(tree.root.findByType(TextInput).props.keyboardType).toBe(
      isNumber ? 'numeric' : 'default',
    );
    renderer.act(() => tree.unmount());
  });

  it('validates and creates a group conversation', () => {
    const data = jest.fn();
    const tree = renderSheet(ActShtCreateConversation, {data});
    const instance = tree.getInstance();

    renderer.act(() => instance.show());
    changeInput(tree, 'Conversation name', 'Support');
    changeInput(tree, "user's id, user's id 2", 'user-1, user-2');
    press(tree, 'Create');
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(data).not.toHaveBeenCalled();

    const groupCheckbox = tree.root
      .findAllByType(TouchableOpacity)
      .find(node => node.props.accessibilityLabel === 'Is group');
    const distinctCheckbox = tree.root
      .findAllByType(TouchableOpacity)
      .find(node => node.props.accessibilityLabel === 'Is distinct');
    renderer.act(() => {
      groupCheckbox.props.onPress();
      distinctCheckbox.props.onPress();
    });
    press(tree, 'Create');

    expect(data).toHaveBeenCalledWith(
      {name: 'Support', isDistinct: true, isGroup: true},
      ['user-1', 'user-2'],
    );
    expect(mockHide).toHaveBeenCalledTimes(1);
    renderer.act(() => tree.unmount());
  });

  it('submits participant, message, conversation and user-id forms', () => {
    const participantData = jest.fn();
    const participantTree = renderSheet(ActShtParticipant, {
      title: 'Add',
      data: participantData,
    });
    renderer.act(() => participantTree.getInstance().show());
    changeInput(participantTree, "user's id, user's id 2", 'user-1, user-2');
    press(participantTree, 'Add');
    expect(participantData).toHaveBeenCalledWith(['user-1', 'user-2']);

    const messageData = jest.fn();
    const messageTree = renderSheet(ActShtSendMsg, {data: messageData});
    renderer.act(() => messageTree.getInstance().show());
    changeInput(messageTree, 'Message content', 'Hello');
    press(messageTree, 'Send');
    expect(messageData).toHaveBeenCalledWith('Hello');

    const conversationData = jest.fn();
    const conversationTree = renderSheet(ActShtUpdateConversation, {
      data: conversationData,
    });
    renderer.act(() => conversationTree.getInstance().show());
    changeInput(conversationTree, 'Conversation name', 'Updated');
    changeInput(conversationTree, 'Conversation avatar', 'avatar-url');
    press(conversationTree, 'Update');
    expect(conversationData).toHaveBeenCalledWith('Updated', 'avatar-url');

    const userData = jest.fn();
    const userTree = renderSheet(ActShtGetUserInfo, {data: userData});
    renderer.act(() => userTree.getInstance().show());
    changeInput(userTree, "user's id, user's id 2", 'user-1, user-2');
    press(userTree, 'Get');
    expect(userData).toHaveBeenCalledWith(['user-1', 'user-2']);

    [participantTree, messageTree, conversationTree, userTree].forEach(tree =>
      renderer.act(() => tree.unmount()),
    );
  });

  it('dispatches every message action and resets edit state on close', () => {
    const data = jest.fn();
    const onClose = jest.fn();
    const tree = renderSheet(ActShtMsgAction, {data, onClose});

    renderer.act(() => tree.getInstance().show());
    press(tree, 'Pin/Unpin message');
    press(tree, 'Delete message');
    press(tree, 'Revoke message');
    press(tree, 'Edit message');
    changeInput(tree, undefined, 'Edited content');
    press(tree, 'Edit');

    expect(data.mock.calls).toEqual([
      ['pinMessage'],
      ['deleteMessage'],
      ['revokeMessage'],
      ['editMessage', 'Edited content'],
    ]);

    const closeContainer = tree.root
      .findAllByType(View)
      .find(node => typeof node.props.onClose === 'function');
    renderer.act(() => closeContainer.props.onClose());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(tree.getInstance().state.isEditMessage).toBe(false);
    renderer.act(() => tree.unmount());
  });

  it('validates and submits all update-user fields', () => {
    const data = jest.fn();
    const tree = renderSheet(ActShtUpdateUserInfo, {data});
    const instance = tree.getInstance();

    renderer.act(() => instance.show());
    press(tree, 'Update');
    expect(Alert.alert).toHaveBeenCalledWith('name is empty');

    const user = {
      name: 'User 1',
      email: 'user@test.com',
      avatar: 'avatar-url',
      phone: '0123',
      location: 'Ha Noi',
      browser: 'Chrome',
      platform: 'Android',
      device: 'Pixel',
      ipAddress: '127.0.0.1',
      hostName: 'localhost',
      userAgent: 'agent',
    };
    renderer.act(() => instance.setUserInfo(user));
    tree.root.findAllByType(TextInput).forEach((input, index) => {
      renderer.act(() => input.props.onChangeText(Object.values(user)[index]));
    });
    press(tree, 'Update');

    expect(data).toHaveBeenCalledWith(expect.objectContaining(user));
    expect(mockHide).toHaveBeenCalledTimes(1);
    renderer.act(() => tree.unmount());
  });
});
