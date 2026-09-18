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
// already-Gradle-8.13-compatible JDK, so the platform + path-existence
// guards below make this a no-op there.
//
// Candidates, in order of preference. A clean JDK 17/21 at a SPACE-FREE
// path is preferred over the Android Studio JBR, because the JBR path
// ("/Applications/Android Studio.app/...") contains a space that breaks
// when passed to the gradlew launcher as JAVA_HOME (the launcher then
// falls back to system Java and fails). A Homebrew Temurin 17 install is
// the most reliable.
const JDK_CANDIDATES = [
  '/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home',
  '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home',
  '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
];

function withGradleJavaHomeFix(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      if (process.platform !== 'darwin') return config;

      const javaHome = JDK_CANDIDATES.find((p) => fs.existsSync(p));
      if (!javaHome) return config;

      const gradlePropsPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle.properties',
      );

      if (fs.existsSync(gradlePropsPath)) {
        let contents = fs.readFileSync(gradlePropsPath, 'utf8');

        if (!contents.includes('org.gradle.java.home')) {
          contents += `\norg.gradle.java.home=${javaHome}\n`;
          fs.writeFileSync(gradlePropsPath, contents);
        }
      }

      return config;
    },
  ]);
}

module.exports = withGradleJavaHomeFix;
