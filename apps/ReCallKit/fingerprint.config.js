/** @type {import('@expo/fingerprint').Config} */
const config = {
  // node_modules/ 内のファイルハッシュをフィンガープリントから除外。
  // 理由: ローカル（package-lock.json あり）と EAS（アップロード時に lock ファイルが
  // 欠落する可能性）で node_modules のレイアウト・バージョンが微妙に異なり、
  // runtimeVersion が永遠に不一致になる。
  // app.json・ネイティブコード・アセット・autolinking メタデータ（contents 型）は
  // 引き続きフィンガープリントに含まれるため、ネイティブ変更の検出は維持される。
  ignorePaths: ['node_modules/**'],
};

module.exports = config;
