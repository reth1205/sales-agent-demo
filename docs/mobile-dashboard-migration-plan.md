# Mobile Dashboard Migration Plan

## Objective

Migrate the dashboard functionality from the current web demo into a production-ready mobile app for field sales representatives. The mobile experience should preserve the core dashboard workflows:

- Map-based customer discovery.
- Visit selection and route simulation.
- Pre-meeting AI briefing.
- Location-aware notifications.
- Interview progress tracking.
- Post-visit debrief and voice capture.
- Offline-first CRM updates and later synchronization.

## Recommended Direction

The recommended path is **React Native + Expo + TypeScript**.

This is the best fit because the current application already uses TypeScript and contains reusable business logic, but the dashboard functionality depends heavily on mobile-native capabilities:

- Maps.
- Geolocation.
- Geofencing.
- Push notifications.
- Background location.
- Offline storage.
- Voice capture.
- Native permissions.

React Native keeps the team close to the existing JavaScript and TypeScript skill set, while Expo reduces operational complexity around mobile builds, notifications, permissions, and device APIs.

Official references:

- React Native documentation: https://reactnative.dev/docs/getting-started
- Expo push notifications: https://docs.expo.dev/push-notifications/overview/
- Expo location and geofencing: https://docs.expo.dev/versions/latest/sdk/location/

## Proposed Technology Stack

### Mobile App

- **Framework:** React Native.
- **Platform layer:** Expo.
- **Language:** TypeScript.
- **Navigation:** Expo Router.
- **UI:** React Native components with a small custom design system.
- **State management:** Zustand or Redux Toolkit.
- **Server state/cache:** TanStack Query.

### Maps and Location

- **Simple maps and pins:** `react-native-maps`.
- **Advanced maps/offline maps/custom styling:** Mapbox or MapLibre.
- **Foreground/background location:** `expo-location`.
- **Geofencing:** `expo-location` + `expo-task-manager`.

Important constraints:

- iOS and Android have different background behavior.
- iOS limits monitored geofence regions.
- Android allows more geofences but background behavior depends on OS and vendor restrictions.
- Background location requires explicit permissions and careful UX.

### Notifications

- **Push:** Expo Notifications.
- **Delivery providers:** APNs for iOS, FCM for Android, abstracted through Expo.
- **Scheduling logic:** Backend-owned.
- **In-app notification stack:** Mobile UI component equivalent to the current `AssistantTopNotification`.

### Offline and Sync

- **Light offline mode:** Expo SQLite.
- **Heavier offline-first data model:** WatermelonDB.
- **Network state:** `@react-native-community/netinfo`.
- **Sync queue:** Local durable queue for pending CRM writes.

### Voice and AI

- **Voice capture:** Native speech-to-text provider or third-party SDK, depending on production requirements.
- **AI briefing/debrief:** Backend endpoint.
- **Model calls:** Never call the model directly from the mobile app.
- **CRM writeback:** Backend service with audit logs and retry semantics.

### Backend

The backend should own:

- Authentication/session validation.
- CRM integration.
- Calendar integration.
- Notification scheduling.
- AI briefing generation.
- AI debrief extraction.
- Writeback to Salesforce or CRM.
- Sync queue reconciliation.
- Audit logging.

## What Can Be Reused From The Current Web App

The current dashboard should not be copied component-for-component into React Native, but several pieces can be reused after extraction.

Reusable:

- Domain types from `src/types.ts`.
- Mock/demo data structures from `src/data.ts`.
- Pure business services from `src/services.ts`.
- Visit state machine concepts.
- Notification types and statuses.
- Briefing and debrief content models.
- Progress simulation logic.
- Copy and UX flows already validated in the demo.

Not directly reusable:

- Solid components.
- CSS layout.
- Leaflet map implementation.
- Browser-only location APIs.
- DOM-specific interactions.

Recommended extraction:

```text
packages/
  core/
    types.ts
    visit-workflow.ts
    briefing.ts
    scoring.ts
    formatting.ts
  api-client/
    crm.ts
    calendar.ts
    notifications.ts
apps/
  web/
  mobile/
```

## Suggested Migration Phases

### Phase 1: Functional Inventory

Map the current dashboard into mobile feature modules:

- Dashboard map.
- Customer pins.
- Visit briefing dialog.
- Route progress.
- Assistant notifications.
- AI briefing sheet.
- Interview progress.
- Post-meeting debrief.
- Questionnaire.
- CRM sync.
- Manager/reporting views.

Output:

- Feature matrix.
- Data dependencies.
- Mobile permission requirements.
- Reusable code list.

### Phase 2: Mobile Architecture

Create the mobile app foundation:

- Expo app scaffold.
- TypeScript config.
- Expo Router.
- App shell and bottom navigation.
- Shared design tokens.
- Shared `packages/core`.
- Mock API layer.

Output:

- Mobile app runs on iOS and Android simulators.
- Shared domain types compile in both web and mobile.

### Phase 3: Dashboard Map MVP

Build the first mobile dashboard slice:

- Map screen.
- Current user location.
- Customer pins.
- Selected customer/visit state.
- Visit briefing dialog.
- Route simulation progress.
- In-app notification stack.

Output:

- Mobile version of the current dashboard demo.
- No real backend dependency yet.

### Phase 4: Location and Notifications

Replace simulation-only behavior with mobile-native behavior:

- Foreground location.
- Permission prompts.
- Background location where needed.
- Geofence entry/exit.
- Push token registration.
- Push notification handling.
- In-app notification routing.

Output:

- Real device test showing location-triggered visit alerts.

### Phase 5: AI Briefing and Debrief

Move assistant workflows to backend-backed flows:

- Pre-meeting briefing request.
- Briefing cache.
- Post-visit debrief trigger.
- Voice capture.
- AI extraction.
- Review/edit before sync.

Output:

- End-to-end visit flow from arrival to CRM-ready debrief.

### Phase 6: Offline-First CRM Sync

Implement durable mobile data behavior:

- Local visit cache.
- Pending writeback queue.
- Retry strategy.
- Conflict handling.
- Sync status UI.
- Error recovery.

Output:

- The app remains useful with poor or no connectivity.

### Phase 7: Production Hardening

Prepare for field usage:

- Authentication.
- Observability.
- Crash reporting.
- Analytics.
- Battery impact testing.
- Background behavior testing.
- Permission-denied flows.
- App Store and Play Store build pipelines.

Output:

- Release candidate for internal pilot.

## Capacitor Alternative

Capacitor is a valid short-term option if the goal is to package the current web dashboard quickly into a mobile shell.

Official reference:

- Capacitor documentation: https://capacitorjs.com/docs
- Capacitor workflow: https://capacitorjs.com/docs/basics/workflow

Benefits:

- Faster path from current web app to mobile installable app.
- Keeps the current web UI.
- Can access native plugins.
- Lower initial migration cost.

Tradeoffs:

- Mobile UX may feel less native.
- Background location and geofencing can become more complex.
- WebView performance and lifecycle constraints matter.
- Long-term maintainability may suffer if the product becomes heavily mobile-native.

Recommended use:

- Good for a demo, pilot, or short-term stakeholder validation.
- Not ideal as the long-term architecture for a field-sales app that depends on background location, push, offline sync, and native device workflows.

## Decision Matrix

| Option | Speed | Native UX | Reuse Current UI | Location/Geofencing | Long-Term Fit |
| --- | --- | --- | --- | --- | --- |
| React Native + Expo | Medium | High | Low/Medium | High | High |
| Capacitor | High | Medium | High | Medium | Medium |
| Fully Native iOS/Android | Low | Very High | Low | Very High | High, but expensive |

## Final Recommendation

Use **React Native + Expo** for the real mobile app.

Use **Capacitor** only if the immediate goal is to create a fast installable prototype from the existing web dashboard.

The safest long-term plan is:

1. Extract shared TypeScript business logic.
2. Build the dashboard map flow in Expo.
3. Add native location and push behavior.
4. Move AI, CRM, scheduling, and sync responsibilities to backend services.
5. Harden offline and permission behavior before production rollout.
