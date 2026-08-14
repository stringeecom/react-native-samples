/**
 * Autolinking metadata required by the React Native 0.65/0.66 CLI.
 */
module.exports = {
  dependencies: {
    'stringee-react-native-v2': {
      platforms: {
        android: {
          packageImportPath:
            'import com.stringeereactnative.RNStringeeReactPackage;',
          packageInstance: 'new RNStringeeReactPackage()',
        },
      },
    },
  },
};
