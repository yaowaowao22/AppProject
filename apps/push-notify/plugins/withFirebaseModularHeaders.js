const { withPodfile } = require("expo/config-plugins");

module.exports = function withFirebaseModularHeaders(config) {
  return withPodfile(config, (c) => {
    let podfile = c.modResults.contents;
    if (!podfile.includes("$RNFirebaseAsStaticFramework")) {
      podfile = "$RNFirebaseAsStaticFramework = true\n" + podfile;
    }
    c.modResults.contents = podfile;
    return c;
  });
};
