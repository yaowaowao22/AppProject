const { withPodfile } = require("expo/config-plugins");

module.exports = function withFirebaseModularHeaders(config) {
  return withPodfile(config, (c) => {
    let podfile = c.modResults.contents;
    const header = [
      "$RNFirebaseAsStaticFramework = true",
      "use_modular_headers!",
    ];
    for (const line of header) {
      if (!podfile.includes(line)) {
        podfile = line + "\n" + podfile;
      }
    }
    c.modResults.contents = podfile;
    return c;
  });
};
