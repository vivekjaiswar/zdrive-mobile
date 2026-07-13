const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Gradle 8.13 (pinned by withGradleWrapperFix.js to dodge the
// IBM_SEMERU bug) refuses to run on JDK versions newer than it
// supports, failing with "Unsupported class file major version 69"
// (= Java 25) if the machine's default JDK is too new for it. This
// only matters for LOCAL builds actually running on a developer's own
// Mac (`expo run:android`, `eas build --local`) - EAS's own cloud
// build servers are Linux machines with their own preconfigured,
// already-Gradle-8.13-compatible JDK and no
// "/Applications/Android Studio..." path at all, so this must never
// apply there. Both guards below (platform + path existence) exist
// specifically to make sure this is a no-op on EAS's cloud builders.
const ANDROID_STUDIO_JBR_PATH =
  '/Applications/Android Studio.app/Contents/jbr/Contents/Home';

function withGradleJavaHomeFix(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      if (process.platform !== 'darwin') return config;
      if (!fs.existsSync(ANDROID_STUDIO_JBR_PATH)) return config;

      const gradlePropsPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle.properties',
      );

      if (fs.existsSync(gradlePropsPath)) {
        let contents = fs.readFileSync(gradlePropsPath, 'utf8');

        if (!contents.includes('org.gradle.java.home')) {
          contents += `\norg.gradle.java.home=${ANDROID_STUDIO_JBR_PATH}\n`;
          fs.writeFileSync(gradlePropsPath, contents);
        }
      }

      return config;
    },
  ]);
}

module.exports = withGradleJavaHomeFix;
