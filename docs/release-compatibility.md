# Compatibility and external assumptions — checked 2026-11-01

Installed and checked: Node 24.19.0, pnpm 11.25.0, Python 3.12.14,
Expo 58.0.22, React Native 0.88.1, React 19.3.0, TypeScript 6.0.3,
Postgres 17 (local container), Pillow and FFmpeg/ffprobe. The pnpm and pip
lockfiles record exact dependency versions. `expo install --check` reports
compatible dependencies. Web bundle export was exercised; native JS export is
recorded in the gate report. No native binary or device build is implied.

Official references fetched successfully during Gate 0:

- [Expo SDK docs](https://docs.expo.dev/versions/latest/): use the compatible
  installed stable SDK, no prerelease tags.
- [Apple upcoming requirements](https://developer.apple.com/news/upcoming-requirements/):
  Xcode 26+ and iOS 26+ SDK for uploads since April 28, 2026. SDK version is
  distinct from minimum device OS; the document also lists iOS 13+ targeting.
- [Google target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en):
  standard mobile new apps/updates target Android 16/API 36+ from August 31, 2026.
- [BFL upstream](https://github.com/black-forest-labs/flux2): FLUX.2 Klein 4B/4B
  Base are listed under Apache 2.0. Klein 9B and dev have different noncommercial
  weight licensing. A model weight license is not a provider data-processing agreement.
- [BFL model pricing](https://help.bfl.ai/articles/7655484417-what-flux-models-are-available):
  Klein 4B listed from $0.014/image. Three base images start at $0.042, not a
  delivered-story price or a measured margin. No inference was purchased.
- [Qwen3-8B license](https://huggingface.co/Qwen/Qwen3-8B/blob/main/LICENSE):
  Apache 2.0 text retrieved. No hosting vendor quote or structured-output
  benchmark has been performed; choose a host only before Gate 2 live use.

Xcode, Android SDK, adb, emulators, Apple/Google accounts and EAS credentials are
absent. Store submission and physical-device testing remain blocked on those
resources. Expo EAS images, current policies, legal terms and vendor quotes must
be rechecked before production. No store acceptance or compliance is claimed.
