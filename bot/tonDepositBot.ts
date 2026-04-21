import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../src/firebase/config'

// Platform wallet address (your receiving wallet)
const PLATFORM_WALLET = 'UQD1Fm7uwhtWK9erHhUUKyPKUvm_X39cXJO_aeoaKL1YcMB5'

// Plan configurations
const PLANS = {
  starter: { name: 'Starter', min: 1, max: 10, dailyRate: 0.005, duration: 30 },
  growth: { name: 'Growth', min: 10, max: 50, dailyRate: 0.007, duration: 45 },
  premium: { name: 'Premium', min: 50, max: 200, dailyRate: 0.01, duration: 60 },
  elite: { name: 'Elite', min: 200, max: 1000, dailyRate: 0.015, duration: 90 },
}

interface TonTransaction {
  hash: string
  from: string
  to: string
  amount: number // in TON
  timestamp: number
}

interface UserData {
  id: string
  username: string
  walletAddress: string
  balance: number
  totalInvested: number
  investments: any[]
}

/**
 * Find the best plan for a given amount
 */
function findPlanForAmount(amount: number): { id: string; plan: typeof PLANS.starter } | null {
  // Check each plan in order (smallest to largest)
  const planEntries = Object.entries(PLANS)
  
  for (const [id, plan] of planEntries) {
    if (amount >= plan.min && amount <= plan.max) {
      return { id, plan }
    }
  }
  
  // If amount is larger than elite max, use elite
  if (amount > PLANS.elite.max) {
    return { id: 'elite', plan: PLANS.elite }
  }
  
  return null
}

/**
 * Fetch recent transactions from TON blockchain via Tonscan API
 */
async function fetchTonTransactions(address: string, limit: number = 50): Promise<TonTransaction[]> {
  try {
    // Using Tonscan API (public)
    const response = await fetch(`https://tonscan.org/api/accounts/${address}/transactions?limit=${limit}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data || !Array.isArray(data)) {
      console.log('No transactions found or invalid response')
      return []
    }
    
    return data
      .filter((tx: any) => tx && tx.in_msg && tx.in_msg.value > 0)
      .map((tx: any) => ({
        hash: tx.hash,
        from: tx.in_msg.source,
        to: tx.in_msg.destination,
        amount: parseFloat((tx.in_msg.value / 1e9).toFixed(3)), // Convert nanoTON to TON
        timestamp: tx.utime * 1000, // Convert to milliseconds
      }))
      .filter((tx: TonTransaction) => 
        // Only deposits between 1 and 1000 TON
        tx.amount >= 1 && tx.amount <= 1000
      )
  } catch (error) {
    console.error('Error fetching TON transactions:', error)
    return []
  }
}

/**
 * Find user by wallet address in Firebase
 */
async function findUserByWallet(walletAddress: string): Promise<UserData | null> {
  if (!db) {
    console.error('Firestore not initialized')
    return null
  }
  
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('walletAddress', '==', walletAddress))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
    } as UserData
  } catch (error) {
    console.error('Error finding user:', error)
    return null
  }
}

/**
 * Check if transaction was already processed
 */
async function isTransactionProcessed(txHash: string): Promise<boolean> {
  if (!db) return false
  
  try {
    const txRef = doc(db, 'processed_transactions', txHash)
    const txSnap = await getDoc(txRef)
    return txSnap.exists()
  } catch (error) {
    console.error('Error checking transaction:', error)
    return false
  }
}

/**
 * Mark transaction as processed
 */
async function markTransactionProcessed(txHash: string, userId: string, amount: number, planId: string) {
  if (!db) return
  
  try {
    await setDoc(doc(db, 'processed_transactions', txHash), {
      userId,
      amount,
      planId,
      processedAt: Timestamp.now(),
      txHash,
    })
  } catch (error) {
    console.error('Error marking transaction:', error)
  }
}

/**
 * Create investment for user
 */
async function createInvestmentForUser(userId: string, amount: number, planId: string): Promise<boolean> {
  if (!db) return false
  
  try {
    const plan = PLANS[planId as keyof typeof PLANS]
    if (!plan) {
      console.error('Invalid plan:', planId)
      return false
    }
    
    const now = new Date()
    const endDate = new Date(now)
    endDate.setDate(endDate.getDate() + plan.duration)
    
    const investment = {
      id: `auto_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      planId,
      amount,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      totalReward: amount * plan.dailyRate * plan.duration,
      claimedReward: 0,
      status: 'active',
      autoCreated: true,
      createdAt: Timestamp.now(),
    }
    
    // Get user document
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      console.error('User not found:', userId)
      return false
    }
    
    const userData = userSnap.data()
    const currentInvestments = userData.investments || []
    
    // Update user with new investment
    await updateDoc(userRef, {
      investments: [...currentInvestments, investment],
      totalInvested: (userData.totalInvested || 0) + amount,
      updatedAt: Timestamp.now(),
    })
    
    // Add transaction record
    await addDoc(collection(db, 'transactions'), {
      userId,
      username: userData.username,
      type: 'deposit',
      amount,
      status: 'completed',
      date: now.toISOString(),
      description: `Auto-invested ${amount} TON in ${plan.name} Plan (Detected via blockchain)`,
      autoProcessed: true,
      txHash: investment.id,
      createdAt: Timestamp.now(),
    })
    
    console.log(`✅ Created ${plan.name} plan for user ${userId} with ${amount} TON`)
    return true
  } catch (error) {
    console.error('Error creating investment:', error)
    return false
  }
}

/**
 * Process all pending deposits
 */
async function processDeposits(): Promise<void> {
  console.log('🔍 Checking for new deposits...')
  
  // Fetch recent transactions to platform wallet
  const transactions = await fetchTonTransactions(PLATFORM_WALLET, 20)
  
  if (transactions.length === 0) {
    console.log('No new deposits found')
    return
  }
  
  console.log(`Found ${transactions.length} transactions to check`)
  
  for (const tx of transactions) {
    try {
      // Skip if already processed
      const alreadyProcessed = await isTransactionProcessed(tx.hash)
      if (alreadyProcessed) {
        console.log(`Skipping already processed tx: ${tx.hash.substring(0, 16)}...`)
        continue
      }
      
      // Find user by sender wallet
      const user = await findUserByWallet(tx.from)
      if (!user) {
        console.log(`No user found for wallet: ${tx.from.substring(0, 16)}...`)
        continue
      }
      
      console.log(`🎯 Found matching user: ${user.username} deposited ${tx.amount} TON`)
      
      // Find appropriate plan
      const planInfo = findPlanForAmount(tx.amount)
      if (!planInfo) {
        console.log(`No suitable plan for amount: ${tx.amount} TON`)
        continue
      }
      
      console.log(`📋 Selected plan: ${planInfo.plan.name} (${planInfo.id})`)
      
      // Create investment
      const success = await createInvestmentForUser(user.id, tx.amount, planInfo.id)
      
      if (success) {
        // Mark as processed
        await markTransactionProcessed(tx.hash, user.id, tx.amount, planInfo.id)
        console.log(`✅ Successfully processed deposit from ${user.username}`)
      }
    } catch (error) {
      console.error(`Error processing tx ${tx.hash}:`, error)
    }
  }
}

/**
 * Start the deposit monitoring bot
 */
export function startDepositBot(intervalMinutes: number = 2): () => void {
  console.log('🤖 Starting TON Deposit Bot...')
  console.log(`⏱️ Checking every ${intervalMinutes} minutes`)
  console.log(`💰 Platform wallet: ${PLATFORM_WALLET}`)
  
  // Run immediately on start
  processDeposits()
  
  // Set up interval
  const intervalId = setInterval(() => {
    processDeposits()
  }, intervalMinutes * 60 * 1000)
  
  // Return stop function
  return () => {
    clearInterval(intervalId)
    console.log('🛑 Deposit bot stopped')
  }
}

// Auto-start if this file is run directly
if (require.main === module) {
  console.log('Starting TON Deposit Bot in standalone mode...')
  startDepositBot(2) // Check every 2 minutes
}
