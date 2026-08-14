/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text} from 'react-native';
import App from '../App';

const mockConnect = jest.fn();
const mockDisconnect = jest.fn();

jest.mock('../src/StringeeClient', () => {
  const ReactModule = require('react');

  /** Minimal imperative Stringee client used by the app render test. */
  return class MockStringeeClient extends ReactModule.Component {
    connect = mockConnect;
    disconnect = mockDisconnect;
    render() {
      return null;
    }
  };
});
jest.mock('react-native-elements', () => ({
  CheckBox: () => null,
  Icon: () => null,
}));
jest.mock('react-native-actions-sheet/src/index', () => {
  const ReactModule = require('react');
  return ReactModule.forwardRef(() => null);
});

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

describe('StringeeChatSample App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main operations and connects with the token placeholder', () => {
    let tree;
    renderer.act(() => {
      tree = renderer.create(<App />);
    });

    const labels = tree.root
      .findAllByType(Text)
      .map(node => node.props.children)
      .flat(Infinity);

    expect(labels).toContain('Create conversation');
    expect(labels).toContain('Get last conversations');
    expect(labels).toContain('Clear db');
    expect(mockConnect).toHaveBeenCalledWith('YOUR_ACCESS_TOKEN');

    renderer.act(() => tree.unmount());
  });
});
