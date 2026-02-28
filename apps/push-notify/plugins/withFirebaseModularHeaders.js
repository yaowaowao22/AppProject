const { withPodfile } = require("expo/config-plugins");

module.exports = function withFirebaseModularHeaders(config) {
  return withPodfile(config, (c) => {
    const podfile = c.modResults.contents;
    if (!podfile.includes("$RNFirebaseAsStaticFramework")) {
      c.modResults.contents =
        "$RNFirebaseAsStaticFramework = true\n" + podfile;
    }
    return c;
  });
};
