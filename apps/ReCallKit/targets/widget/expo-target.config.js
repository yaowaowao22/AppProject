/** @type {import("@bacons/apple-targets").Config} */
module.exports = {
  type: "widget",
  bundleIdentifier: "com.massapp.recallkit.widget",
  deploymentTarget: "16.0",
  frameworks: ["WidgetKit", "SwiftUI"],
  entitlements: {
    "com.apple.security.application-groups": ["group.com.massapp.recallkit"],
  },
};
