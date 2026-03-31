// react-native-reanimated の公式モックを使用
const Reanimated = require('react-native-reanimated/mock');

// withTiming 等のアニメーション関数を no-op に置き換え
Reanimated.default.call = () => {};

module.exports = Reanimated;
