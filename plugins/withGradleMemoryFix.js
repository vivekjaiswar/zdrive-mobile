const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// This project pulls in enough native modules (reanimated, worklets,
// screens, sentry, pdf, blob-util, webview, masked-view, gesture-handler,
// safe-area-context, ...) that Android Lint's "lintVitalAnalyzeRelease"
// task - which runs on every release-type build, including
// `eas build --local` - exhausts Gradle's default JVM Metaspace (512m)
// while class-loading all of it, crashing with an OutOfMemoryError deep
// inside lint's own Kotlin UAST analysis. This is not a bug in this
// app's own code - lint itself runs out of room to load classes, and
// Gradle's stock defaults (2g heap / 512m metaspace, from the RN/Expo
// template) were never sized for a project pulling in this many native
// modules at once.
//
// Same reasoning as withGradleWrapperFix.js / withGradleJavaHomeFix.js:
// EAS (both cloud and --local) regenerates android/ from scratch via
// `expo prebuild` every time, so a one-off hand edit to the gitignored
// android/gradle.properties never survives - this has to be written on
// every prebuild instead.
function withGradleMemoryFix(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const gradlePropsPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle.properties',
      );

      if (fs.existsSync(gradlePropsPath)) {
        let contents = fs.readFileSync(gradlePropsPath, 'utf8');

        const JVM_ARGS =
          '-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError';

        if (/^org\.gradle\.jvmargs=.*$/m.test(contents)) {
          contents = contents.replace(
            /^org\.gradle\.jvmargs=.*$/m,
            `org.gradle.jvmargs=${JVM_ARGS}`,
          );
        } else {
          contents += `\norg.gradle.jvmargs=${JVM_ARGS}\n`;
        }

        fs.writeFileSync(gradlePropsPath, contents);
      }

      return config;
    },
  ]);
}

module.exports = withGradleMemoryFix;
