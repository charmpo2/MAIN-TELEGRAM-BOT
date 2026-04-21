# TON Invest Mini App

A Telegram Mini App for TON blockchain investment with daily rewards and a referral program.

## Features

- **TON Connect** — Connect your TON wallet securely
- **Investment Plans** — Multiple tiers (Starter, Growth, Premium, Elite) with daily returns
- **Daily Rewards** — Claim rewards automatically based on your stake
- **Referral Program** — Earn 5% from direct referrals and 2% from second-level
- **Transaction History** — Full history of deposits, rewards, and referrals
- **Firebase Integration** — Optional Firestore backend for persistent data

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser. The app works outside Telegram too.

## Firebase Setup (Optional)

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project
2. Enable Firestore Database and Authentication
3. Copy your project config and create a `.env` file:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:...:web:...
```

4. Firestore collections needed:
   - `investments` — stores user investment records
   - `transactions` — stores deposit/withdraw/reward history
   - `referrals` — stores referral codes and downline data

## Telegram Mini App Setup

1. Create a bot with [@BotFather](https://t.me/BotFather)
2. Set the Mini App URL to your deployed app URL
3. Update `public/tonconnect-manifest.json` with your deployed URL
4. Update the bot username in `src/services/investmentService.ts` (replace `ton_invest_bot`)

## TON Connect Manifest

Before deploying, update `public/tonconnect-manifest.json` with your actual app URL and icon.

## Important: Smart Contracts

This app is a **frontend prototype**. Real TON investments require deployed smart contracts to:
- Receive and lock user deposits
- Calculate and distribute rewards
- Handle withdrawals securely

The current implementation uses localStorage (with optional Firestore sync) for demo purposes.
