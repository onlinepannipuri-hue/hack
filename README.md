# Secure SMS Dashboard & Messenger

A complete, full-stack application that provides an interactive, real-time SMS messenger client on Android alongside a live web dashboard to view, search, and manage SMS messages from your own device.

---

## 1. System Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                     Android Mobile App (Flutter)                 │
│                                                                  │
│  - Real-time SMS Reading & Native Sending (SmsManager)           │
│  - Automatic Contact Name Resolution (ContactsContract)          │
│  - WhatsApp / Instagram-style Dark Chat UI with Date Dividers    │
│  - Runtime Permission Disclosures (READ_SMS, SEND_SMS, CONTACTS) │
│  - Delta Synchronization & Dynamic URL Fallback Engine           │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
                                  │ HTTPS (JWT Bearer Auth)
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Node.js + Express API                       │
│                                                                  │
│  - JWT Access & Refresh Token Security Layer                     │
│  - Strict User & Device Authorization Checks                     │
│  - Bulk Upsert with Compound Unique Constraint Deduplication     │
│  - Socket.IO Isolated User Rooms (`user:{userId}`)               │
└────────────────────┬─────────────────────────────┬───────────────┘
                     │                             │
                     ▼                             ▼
┌─────────────────────────────────┐   ┌────────────────────────────┐
│      Database (MongoDB)         │   │       Web Dashboard        │
│                                 │   │   (React + Vite + Tailwind)│
│  - Users                        │   │                            │
│  - Devices                      │   │  - Real-time SMS Streaming │
│  - SmsMessages (Unique)         │   │  - WhatsApp-like Split View│
│    (userId + deviceId +         │   │  - Phone & Keyword Search  │
│     deviceMessageId)            │   │  - OTP & Transaction Tab   │
└─────────────────────────────────┘   └────────────────────────────┘
```

---

## 2. Key Features

### 📱 Android Mobile Client
- **Two-Way SMS Client**: Read inbox and sent messages, and compose/send real SMS directly from within the app using Android's native `SmsManager`.
- **Contact Name Resolution**: Automatically resolves raw phone numbers to contact names via `ContactsContract` with intelligent caching.
- **WhatsApp & Instagram Styled Chat UI**:
  - Gradient indigo/violet sent message bubbles (aligned right) with double delivery ticks (`✓✓`).
  - Dark slate received message bubbles (aligned left) with timestamps.
  - Date group separator pills ("Today", "Yesterday", or formatted dates).
  - Modern bottom compose bar with animated send button, emoji selector, and microphone toggle.
- **Instant Search**: Search conversations by phone number (e.g. `9597765055`), contact name, or message body.
- **One-Tap Cloud Sync**: Push all device messages to your secure private backend in milliseconds.

### 💻 Web Dashboard
- **Live Real-time Streaming**: Instant socket updates when new SMS messages arrive or are synced.
- **Split-View Conversation Viewer**: Browse individual threads with complete message history.
- **Smart Filters & Search**: Search across senders, contacts, and message bodies with dedicated OTP highlights.
- **Multi-Device Support**: Manage and monitor sync status across multiple registered devices.

---

## 3. Security & Privacy Principles

- **Official Android Runtime Permissions**: The app declares `<uses-permission android:name="android.permission.READ_SMS" />`, `<uses-permission android:name="android.permission.SEND_SMS" />`, and `<uses-permission android:name="android.permission.READ_CONTACTS" />` with user-controlled runtime permission prompts.
- **Zero Spyware / Zero Accessibility Abuse**: Uses standard Android SDK APIs (`ContentResolver`, `SmsManager`, `ContactsContract`).
- **Data Isolation**: All SMS and Device records are strictly isolated by `userId`. User A cannot access or view User B's SMS data.
- **Deduplication Engine**: Compound index on `{ userId: 1, deviceId: 1, deviceMessageId: 1 }` prevents duplicate entries across sync operations.
- **Server Copy vs Physical Phone SMS**: Deleting SMS from the web dashboard only removes server-side copies and never modifies or deletes messages on the physical Android device.

---

## 4. Project Structure

```text
hack/
├── backend/
│   ├── src/
│   │   ├── config/ (db.js, env.js)
│   │   ├── controllers/ (authController.js, deviceController.js, smsController.js)
│   │   ├── middleware/ (auth.js, rateLimiter.js, validate.js, errorHandler.js, logger.js)
│   │   ├── models/ (User.js, Device.js, SmsMessage.js)
│   │   ├── routes/ (authRoutes.js, deviceRoutes.js, smsRoutes.js)
│   │   ├── sockets/ (socketManager.js)
│   │   ├── utils/ (tokens.js, response.js)
│   │   └── server.js
│   ├── tests/ (api.test.js)
│   ├── package.json
│   └── .env
│
├── web/
│   ├── src/
│   │   ├── components/ (Navbar.jsx, Sidebar.jsx, ConversationList.jsx, MessageList.jsx, StatCard.jsx)
│   │   ├── pages/ (Login.jsx, Register.jsx, Dashboard.jsx, Conversations.jsx, Devices.jsx, Settings.jsx)
│   │   ├── context/ (AuthContext.jsx, SocketContext.jsx)
│   │   ├── services/ (api.js, socket.js)
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── mobile/
│   ├── android/
│   │   └── app/src/main/
│   │       ├── AndroidManifest.xml (READ_SMS, SEND_SMS, READ_CONTACTS)
│   │       └── kotlin/com/example/sms_reader/MainActivity.kt (Native MethodChannel for SMS & Contacts)
│   ├── lib/
│   │   ├── config/ (app_config.dart)
│   │   ├── models/ (sms_message.dart, user.dart, device.dart)
│   │   ├── services/ (sms_service.dart, api_service.dart, auth_service.dart, sync_manager.dart)
│   │   ├── screens/ (home_screen.dart, conversation_detail_screen.dart, settings_screen.dart, ...)
│   │   ├── widgets/ (conversation_bubble.dart, sms_tile.dart, sync_banner.dart)
│   │   └── main.dart
│   └── pubspec.yaml
│
└── README.md
```

---

## 5. Setup & Running Instructions

### Prerequisites
- **Node.js (v18+)** & npm
- **Flutter SDK (v3.19+)** with Android SDK installed
- **MongoDB** (Local instance or MongoDB Atlas connection string)
- **Android Device or Emulator**

---

### Step 1: Start Backend Server

1. Open terminal in `backend/`:
   ```bash
   cd backend
   npm install
   ```

2. Verify or update `backend/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/secure_sms_dashboard
   JWT_SECRET=super_secret_jwt_access_token_key_change_in_production_32char_min
   JWT_REFRESH_SECRET=super_secret_jwt_refresh_token_key_change_in_production_32char
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

3. Launch server:
   ```bash
   npm run dev
   ```
   *Backend will run on `http://localhost:5000` with WebSocket support.*

---

### Step 2: Start Web Dashboard

1. Open terminal in `web/`:
   ```bash
   cd web
   npm install
   ```

2. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *Dashboard opens at `https://hack-epyi.vercel.app` (or local `http://localhost:5173`).*

---

### Step 3: Run Android Mobile App

#### Physical Phone via USB:
1. Enable **Developer Options** and turn **ON** **USB Debugging** + **Install via USB**.
2. Connect your phone via USB and forward the backend port:
   ```bash
   adb reverse tcp:5000 tcp:5000
   ```
3. Run the app:
   ```bash
   cd mobile
   flutter run
   ```

*(Optional: Run `scrcpy` in a separate terminal to view and control your physical Android screen directly from your PC!)*

---

## 6. How to View Messages for a Specific Number (e.g., 9597765055)

### In Mobile App:
1. Open the app on your phone.
2. Tap the **Search Icon (🔍)** in the top app bar.
3. Type `9597765055` (or the contact's name).
4. Tap the conversation to view the full WhatsApp-style message history (both received and sent messages) or send a reply!

### In Web Dashboard:
1. Tap **"Sync Now"** in the mobile app.
2. Open `http://localhost:5173` in your browser.
3. In the search box on the Dashboard or Conversations tab, enter `9597765055`.
4. Click on the contact thread to view the complete synchronized conversation history with timestamps and OTP indicators.

---

## 7. API Reference

### Authentication
- `POST /api/auth/register` — Create user account
- `POST /api/auth/login` — Sign in and receive access & refresh tokens
- `POST /api/auth/refresh` — Refresh expired access token
- `POST /api/auth/logout` — Revoke refresh token
- `GET  /api/auth/me` — Retrieve authenticated user profile

### Devices
- `POST /api/devices/register` — Register/update authorized device
- `GET  /api/devices` — List user's registered devices
- `DELETE /api/devices/:deviceId` — Revoke device access

### SMS Operations
- `POST /api/sms/sync` — Bulk upsert SMS messages with duplicate protection
- `GET  /api/sms` — Paginated list of SMS messages
- `GET  /api/sms/conversations` — Grouped conversations with preview snippet
- `GET  /api/sms/conversations/:sender` — Chronological conversation thread
- `GET  /api/sms/search?q=keyword` — Global search across senders, contacts, and message bodies
- `DELETE /api/sms` — Delete server-side synchronized records
