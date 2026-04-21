# 🤖 TON Deposit Monitoring Bot

Automatically detects TON deposits to your platform wallet and auto-creates investment plans for registered users.

## ✨ Features

- 🔍 **Constantly monitors** TON blockchain for deposits to your platform wallet
- 👤 **Matches sender addresses** with registered users in your Firebase database
- 💰 **Auto-creates investments** based on deposit amount (1-1000 TON)
- 📋 **Plan selection:**
  - **Starter:** 1-10 TON (0.5%/day, 30 days)
  - **Growth:** 10-50 TON (0.7%/day, 45 days)
  - **Premium:** 50-200 TON (1%/day, 60 days)
  - **Elite:** 200-1000 TON (1.5%/day, 90 days)
- ✅ **Prevents double-processing** - tracks processed transactions
- 📝 **Creates transaction records** in your database

## 🚀 Deployment Options

### Option 1: Run on Your Computer (Local)

```bash
cd bot
npm install
npm run build
npm start
```

### Option 2: Deploy to Render/Railway (Recommended)

1. Push this `bot` folder to a new GitHub repo
2. Connect to [Render](https://render.com) or [Railway](https://railway.app)
3. Set environment variables (see below)
4. Deploy as a "Background Worker"

### Option 3: Firebase Cloud Functions

Deploy as a scheduled cloud function that runs every 2 minutes.

## 🔧 Environment Variables

Create `.env` file in the `bot` folder:

```env
# Firebase Configuration (same as your main app)
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:xxxxx:web:xxxxx

# Bot Configuration
CHECK_INTERVAL_MINUTES=2
PLATFORM_WALLET=UQD1Fm7uwhtWK9erHhUUKyPKUvm_X39cXJO_aeoaKL1YcMB5
```

## 📊 How It Works

1. **Bot polls TON blockchain** every 2 minutes via Tonscan API
2. **Checks transactions** to your platform wallet (UQD1...)
3. **Finds matching users** by comparing sender address with registered user wallets
4. **Validates amount** (must be 1-1000 TON)
5. **Selects appropriate plan** based on deposit amount
6. **Creates investment** in user's Firebase account
7. **Records transaction** as "completed" deposit
8. **Marks as processed** to prevent duplicates

## 🎯 Example Flow

```
User deposits 10.57 TON to UQD1Fm7... (platform wallet)
    ↓
Bot detects transaction
    ↓
Matches wallet address to @charmpo in database
    ↓
Amount 10.57 TON → Growth Plan (10-50 TON range)
    ↓
Auto-creates Growth Plan investment
    ↓
User sees new active plan in their dashboard
```

## 🔒 Security Features

- ✅ Only processes deposits 1-1000 TON
- ✅ Prevents duplicate processing (tracks tx hashes)
- ✅ Only works for registered users with matching wallet
- ✅ Creates audit trail with transaction records

## 📝 Firebase Collections Used

- `users` - Finds users by wallet address
- `transactions` - Records auto-processed deposits
- `processed_transactions` - Prevents double-processing

## 🐛 Troubleshooting

Check logs for:
- "No user found for wallet" → User needs to register wallet in app first
- "No suitable plan" → Amount outside 1-1000 TON range
- "Already processed" → Transaction was handled previously

## 🎮 Integration with Main App

The bot runs independently and updates the same Firebase database your app uses. When the bot creates an investment:

1. User's `investments` array gets new investment object
2. `totalInvested` increases by deposit amount
3. `transactions` collection gets new deposit record
4. User sees new active plan immediately in app

## ⚡ Important Notes

- Bot requires Firebase service account or web API key
- Uses Tonscan public API (rate limited, free)
- For production, consider using TON Center API with API key
- Wallet address format: Must match exactly (case-sensitive)

---

**Deploy this bot and users can just send TON to your wallet - investments auto-create!** 🚀
