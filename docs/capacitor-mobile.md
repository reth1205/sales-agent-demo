# Capacitor Mobile App

The SolidJS web demo is now wrapped with Capacitor for iOS and Android.

## Local Workflow

```bash
npm install
npm run mobile:sync
npm run cap:open:android
```

On macOS with Xcode installed:

```bash
npm run mobile:sync
npm run cap:open:ios
```

`npm run mobile:sync` builds the Vite app into `dist` and copies the assets into the native Capacitor projects.

## App Identity

- App name: `Sales Agent Demo`
- App id / Android application id / iOS bundle id: `com.salesagent.demo`
- Web assets directory: `dist`

Change these in `capacitor.config.ts` before creating Firebase or Apple credentials for another app id.

## Push Notifications

The app includes `@capacitor/push-notifications` and a Settings panel that:

- Detects whether the app is running inside Capacitor.
- Requests notification permission on device.
- Registers the device for APNs/FCM.
- Stores and displays the device token for backend registration.
- Handles foreground notifications with the existing in-app toast layer.
- Supports notification click routing when the payload includes `data.route` or `data.href`.

Example push payload data:

```json
{
  "title": "Arrival detected",
  "body": "Open the visit briefing for Global Retail.",
  "data": {
    "route": "/dashboard"
  }
}
```

## Android Push Setup

Android builds require Android Studio or a local JDK with `JAVA_HOME` configured.

1. Create a Firebase project.
2. Add an Android app using package name `com.salesagent.demo`.
3. Download `google-services.json`.
4. Place it at `android/app/google-services.json`.
5. Run `npm run mobile:sync`.
6. Build/run from Android Studio.

The generated `android/app/build.gradle` already applies the Google Services plugin when `google-services.json` exists.

## iOS Push Setup

iOS builds require macOS, Xcode and an Apple Developer team.

1. Open the iOS project on macOS with `npm run cap:open:ios`.
2. Set the app bundle id to `com.salesagent.demo` if Xcode prompts for signing updates.
3. Enable the Push Notifications capability.
4. Configure signing with an Apple Developer team.
5. Build/run on a physical device.

The iOS `AppDelegate.swift` includes the APNs registration callbacks required by the Capacitor push plugin.

## Backend Responsibility

The mobile app only requests permission and obtains a device token. A backend should:

- Store the token against the authenticated user.
- Send visit, route, arrival, debrief and CRM-sync notifications.
- Rotate/remove stale tokens.
- Use FCM for Android and APNs for iOS, or a notification provider that supports both.
