/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text} from 'react-native';
import App from '../App';

const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockGetChatProfile = jest.fn();

jest.mock('../src/StringeeClient', () => {
  const ReactModule = require('react');

  /** Minimal imperative Stringee client used by the app render test. */
  return class MockStringeeClient extends ReactModule.Component {
    connect = mockConnect;
    disconnect = mockDisconnect;
    getChatProfile = mockGetChatProfile;
    render() {
      return null;
    }
  };
});
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({children}) => children,
}));
jest.mock('@react-navigation/native/src/NavigationContainer', () => {
  return ({children}) => children;
});
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({children}) => children,
    Screen: ({component: Screen}) => <Screen />,
  }),
}));
jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({children}) => children,
    Screen: ({component: Screen}) => <Screen />,
  }),
}));

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

describe('LiveChatSample App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both sample flows and initializes their Stringee clients', () => {
    let tree;
    renderer.act(() => {
      tree = renderer.create(<App />);
    });

    const labels = tree.root
      .findAllByType(Text)
      .map(node => node.props.children)
      .flat(Infinity);

    expect(labels).toContain('Connect');
    expect(labels).toContain('Logged in as: ');
    expect(mockGetChatProfile).toHaveBeenCalledWith(
      'YOUR_WIDGET_KEY',
      expect.any(Function),
    );
    expect(mockConnect).toHaveBeenCalledWith('YOUR_ACCESS_TOKEN');

    renderer.act(() => tree.unmount());
  });
});
