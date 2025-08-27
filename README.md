# PokerPal - Poker Tracker for Friends

Welcome to PokerPal! This is a complete web application for tracking poker session results for a group of friends. It's built with Next.js, TypeScript, and Firebase, featuring a modern, real-time, and responsive interface.

## 🚀 Core Features

-   **Session Logging**: Easily record date, location, and player results for each poker session.
-   **Real-time History**: View a complete history of all sessions, updated instantly for all users.
-   **Automated Leaderboard**: A dynamic leaderboard ranks players by total earnings and shows detailed statistics.
-   **Easy Setup**: A simple UI to configure your own Firebase backend.
-   **Persistent Data**: Session data is stored securely in Firestore, and your Firebase configuration is saved in your browser's local storage.
-   **Modern Design**: A clean, responsive, and visually appealing interface built with ShadCN UI and Tailwind CSS.

---

## 🛠️ Setup & Deployment

To use PokerPal, you need to connect it to your own Firebase project and deploy it. The recommended way to deploy is with Vercel, which offers a generous free tier that does not require a credit card.

### Step 1: Create a Firebase Project

First, you need a Firebase project to store your data.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and give it a name (e.g., "PokerPal Tracker").
3.  Follow the on-screen steps. Google Analytics is optional.

### Step 2: Create a Firestore Database

1.  In your new Firebase project, go to the **Build > Firestore Database** section.
2.  Click **"Create database"**.
3.  Start in **production mode**.
4.  Choose a location for your database (e.g., `us-central`).
5.  Click **"Enable"**.

### Step 3: Set Firestore Security Rules

For a small, trusted group of friends, you can use open rules that allow anyone to read and write data.

1.  In the Firestore section, go to the **"Rules"** tab.
2.  Replace the existing rules with the following:
    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Allow read/write access to all documents
        match /{document=**} {
          allow read, write: if true;
        }
      }
    }
    ```
3.  Click **"Publish"**.

### Step 4: Get Your Firebase App Credentials

1.  Go to **Project Settings** (click the ⚙️ icon next to "Project Overview").
2.  In the **"General"** tab, scroll down to **"Your apps"**.
3.  Click the **web icon (`</>`)** to create a new web app.
4.  Give it a nickname (e.g., "PokerPal Web") and click **"Register app"**.
5.  Firebase will show you your configuration credentials (an object with `apiKey`, `authDomain`, etc.). **Copy these values.** You will need them for the deployment step.

### Step 5: Deploy with Vercel (Recommended & Free)

Vercel provides a seamless deployment experience for Next.js apps and its free plan is perfect for this project.

1.  **Create a GitHub Account**: If you don't have one, create a free account at [github.com](https://github.com).
2.  **Create a New Repository**: Create a new, empty repository on GitHub to hold your project's code.
3.  **Upload Your Code**: Upload the PokerPal application files to this new GitHub repository.
4.  **Sign up on Vercel**: Go to [vercel.com](https://vercel.com) and sign up with your GitHub account. It's free and no credit card is required.
5.  **Import Project**: From your Vercel dashboard, click **"Add New... > Project"**.
6.  **Select Your Repository**: Find and select the GitHub repository you just created.
7.  **Configure Environment Variables**:
    *   Expand the **"Environment Variables"** section.
    *   Add the Firebase credentials you copied in Step 4. Each key-value pair from your Firebase config needs to be a separate environment variable. The names must be:
        -   `NEXT_PUBLIC_FIREBASE_API_KEY`
        -   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
        -   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
        -   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
        -   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
        -   `NEXT_PUBLIC_FIREBASE_APP_ID`
8.  **Deploy**: Click the **"Deploy"** button.
9.  **Done!**: Vercel will build and deploy your site, giving you a public URL (e.g., `https://poker-pal-xxx.vercel.app`).

---

## 🚀 Using the App

1.  Open your deployed site's URL.
2.  **Create a Home Game**: The first person to use the app will be prompted to create a new "Home Game". This involves:
    *   Choosing a `Home Game Code` (like a password for your group).
    *   Adding the names of the initial players.
3.  **Share with Friends**: Share the URL and the `Home Game Code` with your friends.
4.  **Join the Game**: Your friends will use the "Join Game" tab and enter the code to get access to the shared session data.

From now on, everyone in the group can add sessions and see the shared leaderboard!

---

## 💻 Running Locally

To run the project on your local machine:

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Create a file named `.env.local` in the root of your project.
4.  Add your Firebase credentials to the `.env.local` file like this:
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```
5.  Run the development server: `npm run dev`
6.  Open [http://localhost:9002](http://localhost:9002) in your browser.
