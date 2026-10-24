# OJI DRIVE (zdrive_mobile) — Project Memory & Architecture Guide

> **Note**: This file serves as the living source of truth for the OJI Drive mobile codebase. All updates, architectural decisions, and operational commands must be recorded here in real-time.

---

## 1. Project Overview & Identity

- **Application Name**: OJI Drive
- **Package / Repo**: `zdrive_mobile` (Version `1.9.5`)
- **Bundle Identifier (iOS)**: `in.zhdrive.app`
- **Design Philosophy**: Apple iOS 27 Liquid Glass aesthetic with an **Instagram-style dynamic scroll-shrinking bottom tab navigation bar**.
- **Brand Palette**:
  - Primary Accent: `#FF5E1E` (Vibrant Orange)
  - Secondary Accent: `#FF3B30`
  - Dark Mode Background: `#000000` with subtle glass orbs
  - Light Mode Background: `#F2F2F7` system glass
  - Typography: `Plus Jakarta Sans` (`PlusJakartaSans_400Regular`, `_500Medium`, `_600SemiBold`, `_700Bold`)

---

## 2. Core Tech Stack (Expo SDK 58)

| Package | Version | Purpose |
|---|---|---|
| `expo` | `^58.0.0` (58.0.19) | Application Framework |
| `react-native` | `0.88.0` | Native Runtime |
| `react` / `react-dom` | `19.3.0` | UI Engine |
| `expo-router` | `~58.0.26` | File-based Routing |
| `react-native-reanimated` | `4.7.1` | Worklet Animations & Dynamic Scroll Physics |
| `react-native-screens` | `~4.30.0` | Native Screen Hierarchy |
| `expo-glass-effect` / `expo-blur` | `~58.0.5` | Liquid Glass Surfaces |
| `react-native-pdf` | `^7.0.4` | Native PDF Engine (Requires Dev Build) |
| `react-native-blob-util` | `^0.24.10` | Native File Transfer (Requires Dev Build) |
| `@react-native-google-signin/google-signin` | `^16.1.5` | Native OAuth |
| `@react-native/jest-preset` | `^0.88.0` | Unit & Integration Test Suite |

---

## 3. Why Development Build is Required (Not Expo Go)

> [!IMPORTANT]
> **Expo Go cannot be used for this project** on both the simulator and physical iPhones:
> 1. **Custom Native Modules**: `react-native-pdf`, `react-native-blob-util`, and `@react-native-google-signin` require native Objective-C/Swift compilation not included in standard Expo Go.
> 2. **SDK 58 Support**: Expo Go on the App Store only supports up to SDK 53/54, causing an instant `"Something went wrong"` crash on SDK 58 bundles.
> 
> Always compile and run using **Expo Development Builds** (`expo-dev-client`).

---

## 4. Run & Development Commands

> [!IMPORTANT]
> **Physical Device Only Policy**: All app testing is performed strictly on the user's **physical iPhone**. Emulators/simulators have been deleted from the MacBook. Do not attempt to boot or run against simulators.

### Physical iPhone Development Workflow
```bash
# 1. Compile and install native development build to connected iPhone (first time or native change)
npx expo run:ios --device

# 2. Daily development & live hot-reloading (once development build is installed on iPhone)
npx expo start --clear
```

Open the **OJI Drive** app on the iPhone; it will automatically connect to Metro over the local network with instant hot-reloading.

### Health & Verification Commands
```bash
# 1. Typecheck: 0 errors
npx tsc --noEmit

# 2. Jest Unit Tests: 5 suites, 26 tests passing
npm test

# 3. Expo Doctor: 20/20 checks passed
npx expo-doctor
```

### Ponytail Agent Skills & Review Framework

Ponytail (`DietrichGebert/ponytail`) is installed directly in `.agents/skills/` and `.agents/rules/`:
- `/ponytail`: Lazy senior dev mode ruleset (YAGNI, platform features first, shortest diff).
- `/ponytail-review`: Senior code review of uncommitted diffs, security, load handling, and bloat reduction.
- `/ponytail-audit`: Audit files for dead code, unneeded dependencies, and missing tests.
- `/ponytail-debt`: Technical debt and complexity evaluation.
- `/ponytail-gain`: Identify opportunities for code deletion and simplification.

---

## 5. Architectural Components & Key Files

### Navigation & Tab Bar
- [`src/components/glass/AnimatedTabBar.tsx`](file:///Users/vivekjaiswar/Projects/zdrive_mobile/src/components/glass/AnimatedTabBar.tsx):
  - Instagram-style dynamic floating capsule navigation bar.
  - Smooth scroll response using `react-native-reanimated`:
    - Scale: `1.0 -> 0.82`
    - TranslateY: `0 -> 94pt`
    - Opacity: `1.0 -> 0.6`
  - Safe-area adaptive bottom offset (`insets.bottom > 0 ? insets.bottom + 6 : 16`).

### Dashboard & Responsiveness
- [`src/components/dashboard/DashboardHeader.tsx`](file:///Users/vivekjaiswar/Projects/zdrive_mobile/src/components/dashboard/DashboardHeader.tsx):
  - Two-tier layout:
    - Top Action Bar: Brand Logo (`size={32}`) on left; Search icon (`40x40`) and Profile Avatar (`42x42`) on right.
    - Full-width Greeting Row: `Welcome, <Name>` with responsive `fontSize: 24`, `lineHeight: 30`, and **no truncation (`numberOfLines={1}` removed)** so user names are always 100% visible across all device screen widths.
- [`src/components/dashboard/StorageCard.tsx`](file:///Users/vivekjaiswar/Projects/zdrive_mobile/src/components/dashboard/StorageCard.tsx):
  - Segmented progress bar by category (Images, Videos, Documents).
  - Adaptive wrapping (`flexWrap: 'wrap'`, `gap: 8`) to eliminate collision on narrow screens.
- [`src/components/dashboard/QuickActions.tsx`](file:///Users/vivekjaiswar/Projects/zdrive_mobile/src/components/dashboard/QuickActions.tsx):
  - 2x2 grid using `flexBasis: '47%', flexGrow: 1` for balanced symmetry across iPhone SE (375pt), Standard (393pt), and Max (430pt) viewports.

---

## 6. Security Audit Findings & Baseline

1. **Session & Auth**:
   - Authentication relies strictly on `httpOnly` secure cookies (`zd_session`).
   - Zero access tokens stored in unencrypted local storage or AsyncStorage.
2. **Biometrics**:
   - Hardware-backed biometric keys via iOS Keychain (`expo-secure-store`).
3. **App Transport Security (ATS)**:
   - Plaintext HTTP blocked via `NSAllowsArbitraryLoads: false` in `Info.plist`.
4. **Archive Safety**:
   - Zip Slip path traversal mitigation implemented in `unzip.service.ts` with canonical path validation.
5. **PII Protection**:
   - Sentry error logging scrubs auth cookies, bearer headers, and user PII in `beforeBreadcrumb`.

---

## 7. Change Log & History

| Date / Time | Action | Details |
|---|---|---|
| 2026-10-24 | **Expo SDK 58 Upgrade** | Upgraded from SDK 56 to SDK 58 (`react-native@0.88.0`, `react@19.3.0`, `expo-router@58.0.26`). Fixed Jest preset with `@react-native/jest-preset@0.88.0`. Clean `expo-doctor` pass (20/20). |
| 2026-10-24 | **Open Code Review** | Integrated `@alibaba-group/open-code-review` (`v1.13.3`), configured provider for Gemini with `gemini-2.5-flash`. |
| 2026-10-24 | **Security Audit** | Verified session cookie security, biometric keystore, Zip Slip protection, ATS rules, and Sentry PII sanitization. |
| 2026-10-24 | **Header Name Truncation Fix** | Identified root cause of `Welcome, Vivek Jais...` (horizontal space squeezing + `numberOfLines={1}` + iOS nested `<Text>` bug). Separated into top actions bar and dedicated full-width greeting row. |
| 2026-10-24 | **Cross-Device Responsiveness** | Updated `QuickActions` grid cards (`flexBasis: '47%'`) and `StorageCard` legend (`flexWrap: 'wrap'`) for flawless rendering across all iPhone and Android screen widths. |
| 2026-10-24 | **Physical Device Deployment** | Identified Expo Go incompatibility (native modules + SDK 58). Initiated direct native development build compilation to physical iPhone via `npx expo run:ios --device`. |
| 2026-10-24 | **Physical Device Verification** | OJI Drive successfully compiled, installed, and launched on physical iPhone. User logged in, confirmed full greeting name display ("Welcome, Vivek Jaiswar") without truncation, and verified Instagram-style dynamic scroll-shrink navigation bar physics working smoothly. |
| 2026-10-24 | **Ponytail Integration** | Removed Alibaba Open Code Review (`@alibaba-group/open-code-review`). Installed DietrichGebert/ponytail (`.agents/skills/`, `.agents/rules/`, `.cursor/rules/`, and `AGENTS.md`) providing native lazy-senior-dev rules and code review commands (`/ponytail`, `/ponytail-review`, etc.). |
| 2026-10-24 | **Testing Policy Update** | Simulator retired and removed from MacBook. Established strict Physical iPhone Only testing policy via `npx expo run:ios --device` and Metro hot-reloading. |
| 2026-10-24 | **Space & Cache Cleanup** | Executed deep cleanup: erased simulator runtime caches (`xcrun simctl erase all`), deleted 4.0GB `ios/build`, cleaned `.expo` cache, and purged npm cache (`npm cache clean --force`). Reclaimed ~12 GB of free disk space (available space increased from 25 GiB to 37 GiB). |
