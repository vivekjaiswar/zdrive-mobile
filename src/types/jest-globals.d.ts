// Forces TypeScript to load @types/jest's ambient globals (describe/it/
// expect/...) project-wide. Under Expo's tsconfig (moduleResolution:
// "bundler"), the @types/jest package isn't auto-included, so the test
// files couldn't see the runner globals and `tsc` failed on them. This
// reference directive pulls them in without touching the app's runtime.
/// <reference types="jest" />
