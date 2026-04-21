# TechOL - Complete Setup Guide 🚀

## Step 1: Create a Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Create a project"** (or "Add project")
3. Enter project name: `techol` (or any name you like)
4. Disable Google Analytics (optional, not needed)
5. Click **"Create project"**
6. Wait for it to be created, then click **"Continue"**

## Step 2: Register a Web App

1. On the project overview page, click the **Web icon** (looks like `</>`)
2. Enter app nickname: `TechOL Web`
3. ✅ Check **"Also set up Firebase Hosting"** (optional but recommended)
4. Click **"Register app"**
5. You'll see a code block with your Firebase config — **COPY these values**:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "techol-xxxxx.firebaseapp.com",
     projectId: "techol-xxxxx",
     storageBucket: "techol-xxxxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```
6. **Paste these values** into `js/firebase-config.js` replacing the placeholder values

## Step 3: Enable Authentication

1. In Firebase Console, go to **Build → Authentication**
2. Click **"Get started"**
3. Under **"Sign-in method"** tab:
   - Click **"Email/Password"** → Enable it → Save
   - Click **"Google"** → Enable it → Set a support email.
     - *Note: If you have your own Google Web Client ID and Secret (like `650843617448...`), expand the **"Web SDK configuration"** section here and paste them in. Otherwise, Firebase auto-generates them for you.*
     - Click Save.
   - Click **"Add new provider"** → Select **"Phone"** → Enable it → Save (Required for Phone Login).
4. Go to **"Settings"** tab → **"Authorized domains"**
   - Add `localhost` if not already there
   - Add `127.0.0.1` if not already there

## Step 4: Set Up Firestore Database

1. Go to **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add security rules later)
4. Select a location closest to you (e.g., `asia-south1` for India)
5. Click **"Enable"**

### Create Required Indexes:
Go to **Firestore → Indexes** tab and create these composite indexes:

| Collection | Fields | Query Scope |
|-----------|--------|-------------|
| `posts` | `createdAt` (Descending) | Collection |
| `posts` | `category` (Ascending), `createdAt` (Descending) | Collection |
| `posts` | `authorId` (Ascending), `createdAt` (Descending) | Collection |
| `messages` | `conversationId` (Ascending), `timestamp` (Ascending) | Collection |

## Step 5: Set Up Firebase Storage

1. Go to **Build → Storage**
2. Click **"Get started"**
3. Choose **"Start in test mode"**
4. Select same location as Firestore
5. Click **"Done"**

## Step 6: Deploy Security Rules

### Firestore Rules:
Go to **Firestore → Rules** tab and paste the contents of `firestore.rules` file.

### Storage Rules:
Go to **Storage → Rules** tab and paste:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    match /post-images/{postId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    match /event-banners/{eventId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## Step 7: Run the Application

### Option A: VS Code Live Server (Recommended)
1. Install the **"Live Server"** extension in VS Code
2. Right-click `index.html` → **"Open with Live Server"**
3. It will open at `http://127.0.0.1:5500`

### Option B: Install Node.js
1. Download from **https://nodejs.org** (LTS version)
2. Install it
3. Open terminal in the project folder
4. Run: `npx -y serve .`
5. Open `http://localhost:3000`

### Option C: Python HTTP Server
1. Install Python from **https://python.org**
2. Run: `python -m http.server 8000`
3. Open `http://localhost:8000`

> ⚠️ **Important**: Firebase Auth requires HTTP (not file://). You MUST use one of the above methods.

## Step 8: Test Everything!

1. Open the app in your browser
2. Click **"Get Started"** to create an account
3. Sign up with email/password or Google
4. Create your unique username
5. Start posting, chatting, and exploring!

## Troubleshooting

- **Google Sign-in not working?** Check that your domain is in Firebase Auth → Authorized Domains
- **Posts not saving?** Check Firestore rules and ensure you're logged in
- **Images not uploading?** Check Storage rules and file size limits
- **Chat not updating?** Firestore real-time listeners need proper indexes
