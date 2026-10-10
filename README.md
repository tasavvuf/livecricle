# LiveCircle 📍

> **"Real-time group location app with background tracking, geofence notifications, and Socket.io, built in React Native."**

LiveCircle allows private groups (family, friends, road trips) to opt in to share their live location on a real-time map. Circle administrators can establish perimeter geofences (home, university, basecamp), and circle members receive immediate push notifications whenever someone enters or leaves.

Designed from the ground up according to the **Warm Editorial Minimalism** visual design standard — featuring warm ivory surfaces, contemporary geometric typography, restrained borders, and vivid cobalt accents.

---

## 📸 Interface & Live Preview

```
┌──────────────────────────────────────────────────────────────┐
│  LIVECIRCLE PROTOCOL                                         │
│  Welcome back to your circle.                                │
│  [ SIGN IN ]   [ CREATE ACCOUNT ]                            │
│  Email: alex@livecircle.app                                  │
│  Password: ••••••••                                          │
│  [          Sign In          ]                               │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  ACTIVE CIRCLE: Alpine Road Trip (4)        [● SHARING]     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │       (JD)                    [ Camp Alpha ]           │  │
│  │        ▲                     ╭──────────────╮          │  │
│  │        │                     │  100m Radius │          │  │
│  │     Moving 24 km/h           ╰──────────────╯          │  │
│  │                                      (You)             │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│  CIRCLE MEMBERS (4)                             EXPAND ▲     │
│  • Alex (You)       Broadcasting live coordinates  [LIVE]    │
│  • John Doe         Updated 2m ago                 [LIVE]    │
│  • Sarah Smith      Inside: Camp Alpha             [LIVE]    │
└──────────────────────────────────────────────────────────────┘
```

---

## 🏗 Architecture Diagram

```mermaid
graph TD
    subgraph Mobile Client [React Native / Expo Mobile App]
        UI[Warm Editorial UI & Screens]
        AuthStore[AuthStore / SecureStore]
        LocStore[LocationStore & Zustand]
        FG[Foreground Watcher\nwatchPositionAsync]
        BG[Background TaskManager\nLOCATION_TRACKING_TASK]
        Throttle[20m / 10s Haversine Throttle]
        SocketClient[Socket.io Client Singleton]
    end

    subgraph Backend [Node.js / Express / Socket.io]
        WSServer[Socket.io Gateway\nHandshake JWT Auth]
        REST[Express REST Routes\n/auth, /groups, /me]
        GeoEngine[Geofence Engine\nHaversine + 2-Reading Debounce]
        PushService[Expo Push Service\nexpo-server-sdk]
    end

    subgraph Storage [MongoDB Database]
        UserDoc[(User\nName, Email, PushToken)]
        GroupDoc[(Group\nName, 6-Char Code, Members)]
        FenceDoc[(Geofence\nCenter Lat/Lng, RadiusM)]
        PingDoc[(LocationPing\n24-Hour TTL Auto-Expire)]
        StateDoc[(MemberState\nLast Coordinates, Debounce Map)]
    end

    UI --> AuthStore
    UI --> LocStore
    FG --> Throttle
    BG --> Throttle
    Throttle -->|location_update| SocketClient
    SocketClient <-->|WebSocket| WSServer
    UI <-->|REST API| REST

    REST --> Storage
    WSServer --> PingDoc
    WSServer --> StateDoc
    WSServer --> GeoEngine
    GeoEngine -->|Enter/Exit Transition| PushService
    GeoEngine -->|geofence_event| WSServer
    PushService -->|APNs / FCM| Mobile Client
```

---

## ✅ Deliverables Checklist

- [x] **Authentication**: Register & login with email/password, bcrypt hashing, JWT issuance, session persistence via `expo-secure-store`.
- [x] **Private Circles**: Create private groups, auto-generating unique 6-character alphanumeric invite codes (e.g. `A8K2F9`). Join instantly using 6-character code.
- [x] **Live Map**: Real-time map displaying all circle members with custom editorial initials markers, live pulse status, and last seen timestamps.
- [x] **Location Sharing Toggle**: Prominent master switch giving the user 100% control over when coordinates are broadcast. When OFF, background and foreground trackers are fully terminated.
- [x] **Perimeter Geofences**: Add geofence circles by tapping directly on the map or specifying radius presets (50m, 100m, 200m, 500m, 1000m).
- [x] **Enter & Exit Push Alerts**: Automated background notifications dispatched to all other circle members when someone enters or leaves a zone.
- [x] **2-Reading Jitter Debounce**: Server state machine requires two consecutive readings across the perimeter threshold to eliminate GPS noise false alarms.
- [x] **Background Location Updates**: Integrated `expo-task-manager` task running in the background with battery-conscious 20m/10s throttling.
- [x] **Backend Deployment on Render**: Ready-to-deploy `render.yaml` blueprint and containerized `Dockerfile`.
- [x] **Android APK via EAS**: Configured `eas.json` for seamless cloud or local APK generation.
- [x] **Documentation**: Complete system architecture, API specifications, socket protocol, and privacy guarantees.

---

## 🎨 Design System: Warm Editorial Minimalism

The application strictly implements the visual language defined in `Design Direction: Warm Editorial Minimalism`:

| Token | Hex / Spec | Usage |
|---|---|---|
| **Primary Background** | `#FAF8F1` | Warm ivory paper background |
| **Secondary Background** | `#F5F1E8` | Soft cream card & input surface |
| **Primary Text** | `#17243D` | Deep navy editorial typography |
| **Accent Blue** | `#3158D8` | Vivid cobalt highlights, geofences, and key buttons |
| **Secondary Blue** | `#6479E8` | Soft periwinkle auxiliary accents |
| **Muted Text** | `#77766F` | Warm gray captions and overlines |
| **Borders & Dividers** | `#E6E0D5` | Subtle warm beige dividers |
| **Status Enter** | `#2E7D52` | Forest green online and geofence entry badges |
| **Status Exit** | `#C85A3F` | Terracotta alert badge for perimeter departure |

---

## 📡 API & Socket Protocol

### REST Endpoints

| Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Create account (`name`, `email`, `password`) | No |
| `POST` | `/auth/login` | Sign in (`email`, `password`) | No |
| `GET` | `/auth/me` | Fetch authenticated user profile | Bearer Token |
| `PUT` | `/me/push-token` | Update device Expo push notification token | Bearer Token |
| `POST` | `/groups` | Create group (generates 6-char code) | Bearer Token |
| `POST` | `/groups/join` | Join group via `{ code: "XXXXXX" }` | Bearer Token |
| `GET` | `/groups` | List user's active circles | Bearer Token |
| `GET` | `/groups/:id` | Group details, members, coordinates, and geofences | Bearer Token |
| `POST` | `/groups/:id/geofences` | Create geofence (`name`, `lat`, `lng`, `radiusM`) | Bearer Token |
| `DELETE` | `/groups/:id/geofences/:geofenceId` | Remove geofence perimeter | Bearer Token |

### Socket.io Events

- **Handshake**: Authenticated with JWT token in `auth.token`.
- **`join_group`** (`Client -> Server`): `{ groupId }` — Joins the real-time room for that circle.
- **`location_update`** (`Client -> Server`): `{ groupId, lat, lng, accuracy, ts }` — Broadcasts current location.
- **`member_location`** (`Server -> Client Room`): `{ userId, name, lat, lng, accuracy, ts }` — Emitted to all circle members.
- **`geofence_event`** (`Server -> Client Room`): `{ userId, userName, geofenceId, geofenceName, type: 'enter' | 'exit', ts }` — Broadcasts entry/exit event.

---

## 🔒 Privacy Architecture & Security Guarantees

1. **Explicit Opt-in**: Location sharing is controlled exclusively by the user via the Master Toggle in the Settings screen and Map header.
2. **24-Hour TTL Auto-Purge**: All location pings saved in MongoDB utilize a native Time-To-Live (TTL) index:
   ```ts
   LocationPingSchema.index({ ts: 1 }, { expireAfterSeconds: 86400 });
   ```
   Data is automatically eradicated by MongoDB after 24 hours. No historical track logs are retained permanently.
3. **Perimeter Debouncing**: Prevents harassment and notification spam from GPS drift when a user is standing near a boundary. Two distinct readings confirming the transition are required before any push alert is triggered.
4. **Token Security**: JWT tokens are stored exclusively in native hardware-backed encrypted storage via `expo-secure-store`.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- npm / yarn
- Expo Go app or Android Studio / Xcode

### 2. Run the Backend Server
```bash
# From project directory
npm run server

# Or directly in server directory
cd server
npm install
npm run dev
```
The server will boot on `http://localhost:4000`. If a remote MongoDB instance is not configured in `MONGODB_URI`, it automatically initializes an in-memory database fallback for immediate local testing.

### 3. Run the Mobile App
```bash
# Start Expo development server
npm start
```

Press:
- `a` to open in Android Emulator
- `i` to open in iOS Simulator
- `w` to open on Web

### 4. Build Android APK via EAS
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build standalone APK
eas build --platform android --profile preview
```

### 5. Deploy Backend to Render
1. Push repository to GitHub/GitLab.
2. Connect your repo in Render.
3. Use the included `render.yaml` Blueprint or create a Web Service pointing to root directory `server`.
4. Set environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI
   - `JWT_SECRET`: Random secure string
   - `NODE_ENV`: `production`

---

## ⚠️ Known Limitations & Considerations
- **Battery Optimization (OEM Killers)**: Certain Android manufacturers (Xiaomi MIUI, Samsung OneUI, Huawei) aggressively terminate background processes. Users should exclude LiveCircle from battery saver optimizations for continuous background updates.
- **Web Limitations**: `react-native-maps` and native background services are optimized for physical mobile devices (Android/iOS).
- **Push Notification Simulator**: Physical devices with real Google Play Services or APNs tokens are required to receive native push notifications via `expo-notifications`.
