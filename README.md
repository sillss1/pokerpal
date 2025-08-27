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

## 🛠️ Initial Setup (First-time use)

To use PokerPal, you need to connect it to your own Firebase project. This is a one-time setup.

### 1. Create a Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and give it a name (e.g., "PokerPal Tracker").
3.  Follow the on-screen steps to create the project. Google Analytics is optional.

### 2. Create a Firestore Database

1.  In your new Firebase project, go to the **Build > Firestore Database** section.
2.  Click **"Create database"**.
3.  Start in **production mode**.
4.  Choose a location for your database (e.g., `us-central`).
5.  Click **"Enable"**.

### 3. Set Firestore Security Rules

For a small, trusted group of friends, you can use open rules that allow anyone with the project credentials to read and write data.

1.  In the Firestore section, go to the **"Rules"** tab.
2.  Replace the existing rules with the following:
    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /{document=**} {
          allow read, write: if true;
        }
      }
    }
    ```
3.  Click **"Publish"**.

### 4. Get Your Firebase Credentials

1.  Go to **Project Settings** (click the ⚙️ icon next to "Project Overview").
2.  In the **"General"** tab, scroll down to **"Your apps"**.
3.  Click the **web icon (`</>`)** to create a new web app.
4.  Give it a nickname (e.g., "PokerPal Web") and click **"Register app"**.
5.  Firebase will show you your configuration credentials (a JavaScript object with `apiKey`, `authDomain`, etc.). **Copy these values.** You will need them for the app's setup page.

---

## 🚀 Deployment

You can deploy this application to any modern hosting provider. Here are instructions for Vercel and Netlify.

### Option 1: Vercel (Recommended)

Vercel is the creator of Next.js and provides a seamless deployment experience.

1.  **Fork this Repository**: Create a copy of this project on your own GitHub account.
2.  **Sign up on Vercel**: Go to [vercel.com](https://vercel.com) and sign up with your GitHub account.
3.  **Import Project**: From your Vercel dashboard, click **"Add New... > Project"**.
4.  **Select Repository**: Find and select the repository you forked. Vercel will automatically detect that it's a Next.js project.
5.  **Deploy**: Click the **"Deploy"** button. No extra configuration is needed.
6.  **Done!**: Vercel will build and deploy your site, giving you a public URL (e.g., `https://poker-pal-xxx.vercel.app`).

### Option 2: Netlify

1.  **Fork this Repository**: Create a copy of this project on your own GitHub account.
2.  **Sign up on Netlify**: Go to [netlify.com](https://netlify.com) and sign up with your GitHub account.
3.  **Import Project**: From your Netlify dashboard, click **"Add new site > Import an existing project"**.
4.  **Connect to GitHub**: Connect your GitHub account and authorize Netlify.
5.  **Select Repository**: Choose the repository you forked.
6.  **Deploy**: Netlify will detect the build settings. Click **"Deploy site"**.
7.  **Done!**: Netlify will deploy your site and provide a public URL.

### Post-Deploy: Using the App

1.  Open your deployed site's URL.
2.  Navigate to the **⚙️ Setup** tab.
3.  Paste the Firebase credentials you copied earlier into the form.
4.  Set the names for the 5 players in your group.
5.  Click **"Save Configuration"**.
6.  The app will connect to your Firebase project, and you're ready to start tracking sessions!

Share the URL with your friends. Since the configuration is stored in *your* browser, they will need to perform the same setup step in their own browsers to interact with the data. For a shared experience where they don't need to enter the config, you would hard-code the credentials, which is not recommended for public repositories.

---

## 💻 Running Locally

To run the project on your local machine:

1.  Clone the repository:
    ```bash
    git clone <your-fork-url>
    cd <repository-name>
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:9002](http://localhost:9002) in your browser to see the result.
