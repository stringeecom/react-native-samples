const fs = require('fs');
const path = require('path');

const podspecPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native',
  'third-party-podspecs',
  'boost.podspec',
);
const unavailableUrl =
  'https://boostorg.jfrog.io/artifactory/main/release/1.76.0/source/boost_1_76_0.tar.bz2';
const archiveUrl =
  'https://archives.boost.io/release/1.76.0/source/boost_1_76_0.tar.bz2';

if (!fs.existsSync(podspecPath)) {
  console.log('React Native boost podspec was not found; skipping patch');
  process.exit(0);
}

const podspec = fs.readFileSync(podspecPath, 'utf8');
if (podspec.includes(unavailableUrl)) {
  fs.writeFileSync(podspecPath, podspec.replace(unavailableUrl, archiveUrl));
  console.log('Patched React Native 0.72 boost download URL');
}
