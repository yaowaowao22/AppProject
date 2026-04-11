#!/usr/bin/env python3
# ============================================================
# detect-native-change.py
#
# 目的:
#   iOS ビルド時に「ネイティブモジュールが前回ビルドから変化したか」を
#   SHA-256 ハッシュ1つで判定する。変化していなければ xcodebuild は
#   clean せず高速ビルド、変化していたら clean + prebuild + pod install 必須。
#
# 検出対象:
#   1. Autolinked native modules (node_modules 以下の
#      expo-module.config.json を持つパッケージ) の name@version リスト
#   2. app.json の expo.plugins / expo.ios / expo.android 設定
#   3. react-native.config.js の内容ハッシュ
#
# 実行場所:
#   apps/ReCallKit (カレントディレクトリがプロジェクトルートであること前提)
#
# 出力:
#   stdout に SHA-256 ハッシュ (hex, 64文字) 1行
#   --verbose で stderr に検出内訳を表示
#
# 使い方:
#   python3 scripts/detect-native-change.py
#   python3 scripts/detect-native-change.py --verbose
# ============================================================

import os
import sys
import json
import glob
import hashlib
from pathlib import Path


def collect_native_modules(project_root: Path) -> dict[str, str]:
    """node_modules 内の expo-module.config.json を持つパッケージを列挙し、
    {package_name: version} の dict を返す。Expo autolinking 対象 = native module。
    """
    modules: dict[str, str] = {}
    node_modules = project_root / "node_modules"
    if not node_modules.is_dir():
        return modules

    # 通常パッケージ: node_modules/<name>/expo-module.config.json
    # scoped パッケージ: node_modules/@scope/<name>/expo-module.config.json
    patterns = [
        "node_modules/*/expo-module.config.json",
        "node_modules/@*/*/expo-module.config.json",
    ]
    seen_paths: set[str] = set()
    for pattern in patterns:
        for conf_path_str in glob.glob(str(project_root / pattern)):
            conf_path = Path(conf_path_str)
            if str(conf_path) in seen_paths:
                continue
            seen_paths.add(str(conf_path))
            pkg_dir = conf_path.parent
            pkg_json_path = pkg_dir / "package.json"
            if not pkg_json_path.is_file():
                continue
            try:
                with open(pkg_json_path, encoding="utf-8") as f:
                    pkg = json.load(f)
                name = pkg.get("name")
                version = pkg.get("version", "")
                if isinstance(name, str) and name:
                    modules[name] = version
            except (json.JSONDecodeError, OSError):
                # 読めない package.json はスキップ (ハッシュには含めない)
                continue
    return dict(sorted(modules.items()))


def read_app_json_native_config(project_root: Path) -> dict:
    """app.json から native ビルドに影響するフィールドだけを抽出する。
    plugins / ios / android / scheme / name / slug。
    """
    app_json_path = project_root / "app.json"
    if not app_json_path.is_file():
        return {}
    try:
        with open(app_json_path, encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}
    expo = data.get("expo", {}) if isinstance(data, dict) else {}
    if not isinstance(expo, dict):
        return {}
    # bundleIdentifier や plugins 配列の変更はネイティブビルド出力を変える
    native_fields = {
        "plugins": expo.get("plugins", []),
        "ios": expo.get("ios", {}),
        "android": expo.get("android", {}),
        "scheme": expo.get("scheme"),
        "name": expo.get("name"),
        "slug": expo.get("slug"),
    }
    return native_fields


def read_rn_config_hash(project_root: Path) -> str:
    """react-native.config.js の内容ハッシュを返す。存在しなければ空文字。"""
    rn_config = project_root / "react-native.config.js"
    if not rn_config.is_file():
        return ""
    try:
        with open(rn_config, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()
    except OSError:
        return ""


def compute_signature(project_root: Path) -> tuple[str, dict]:
    """ネイティブビルドに影響する全フィールドを集約し、SHA-256 ハッシュと
    内訳 dict のタプルを返す。
    """
    signature = {
        "native_modules": collect_native_modules(project_root),
        "app_json_native": read_app_json_native_config(project_root),
        "rn_config_hash": read_rn_config_hash(project_root),
    }
    serialized = json.dumps(signature, sort_keys=True, ensure_ascii=False)
    digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    return digest, signature


def main() -> int:
    verbose = "--verbose" in sys.argv or "-v" in sys.argv
    # カレントディレクトリをプロジェクトルートとみなす
    # (build-ios.sh は apps/ReCallKit から実行される前提)
    project_root = Path.cwd()

    digest, signature = compute_signature(project_root)

    if verbose:
        native_count = len(signature["native_modules"])
        plugins_count = len(signature["app_json_native"].get("plugins", []) or [])
        has_rn_config = bool(signature["rn_config_hash"])
        print(f"[detect] cwd: {project_root}", file=sys.stderr)
        print(f"[detect] native modules: {native_count} 個", file=sys.stderr)
        print(f"[detect] app.json plugins: {plugins_count} 個", file=sys.stderr)
        print(f"[detect] react-native.config.js: {'あり' if has_rn_config else 'なし'}", file=sys.stderr)
        print(f"[detect] hash: {digest}", file=sys.stderr)
        if verbose and native_count > 0:
            print("[detect] native module 内訳:", file=sys.stderr)
            for name, version in signature["native_modules"].items():
                print(f"[detect]   {name}@{version}", file=sys.stderr)

    print(digest)
    return 0


if __name__ == "__main__":
    sys.exit(main())
