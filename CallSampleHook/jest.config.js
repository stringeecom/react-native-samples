module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$':
      '<rootDir>/__mocks__/fileMock.js',
    '^react$': '<rootDir>/node_modules/react',
    '^react-native$': '<rootDir>/node_modules/react-native',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-callkeep|react-native-incall-manager|react-native-voip-push-notification|@notifee|@react-native-firebase)/)',
  ],
};
