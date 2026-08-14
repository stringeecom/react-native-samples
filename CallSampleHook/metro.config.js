const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const projectNodeModules = path.resolve(__dirname, 'node_modules');
const localStringeeSdk = path.resolve(
  __dirname,
  '../../stringee-react-native-v2',
);

const config = {
  watchFolders: [path.join(localStringeeSdk, 'lib/commonjs')],
  resolver: {
    blockList: [/\/stringee-react-native-v2\/node_modules\/.*/],
    disableHierarchicalLookup: true,
    nodeModulesPaths: [projectNodeModules],
    extraNodeModules: {
      react: path.join(projectNodeModules, 'react'),
      'react-native': path.join(projectNodeModules, 'react-native'),
      'stringee-react-native-v2': path.join(localStringeeSdk, 'lib/commonjs'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
