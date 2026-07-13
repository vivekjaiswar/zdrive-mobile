const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// React Native 0.85.3's bundled @react-native/gradle-plugin hardcodes
// the "org.gradle.toolchains.foojay-resolver-convention" plugin at
// version 0.5.0 in its settings.gradle.kts template (see
// node_modules/@react-native/gradle-plugin/settings.gradle.kts).
// That plugin version was compiled against a pre-Gradle-9 API that
// referenced JvmVendorSpec.IBM_SEMERU, a field Gradle 9.x removed -
// so any fresh `expo prebuild` that pulls Gradle 9.3.1 (the default
// wrapper version in RN 0.85.3's template) crashes immediately with:
//   "Class org.gradle.jvm.toolchain.JvmVendorSpec does not have
//    member field ... IBM_SEMERU"
// This is a genuine upstream RN 0.85.3 template bug, not something
// fixable by editing the app's own gradle files directly - EAS Build
// (both cloud and --local) always regenerates android/ from scratch
// via prebuild, so a one-off hand-edit to the gitignored android/
// folder (which is what got this working for local `expo run:android`
// builds earlier) never survives a fresh EAS build.
//
// The fix: force the regenerated gradle-wrapper.properties to use
// Gradle 8.13 instead of 9.3.1 (compatible with foojay-resolver 0.5.0
// and the AGP version RN 0.85.3's gradle-plugin pins), every single
// time prebuild runs, in every environment (local machine, EAS cloud,
// eas build --local) - not just once, by hand, on one machine.
function withGradleWrapperFix(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const wrapperPropsPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle',
        'wrapper',
        'gradle-wrapper.properties',
      );

      if (fs.existsSync(wrapperPropsPath)) {
        let contents = fs.readFileSync(wrapperPropsPath, 'utf8');

        contents = contents.replace(
          /^distributionUrl=.*$/m,
          'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.13-bin.zip',
        );

        fs.writeFileSync(wrapperPropsPath, contents);
      }

      return config;
    },
  ]);
}

module.exports = withGradleWrapperFix;
