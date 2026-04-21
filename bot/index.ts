import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import fetch from 'node-fetch'

// Initialize Firebase Admin (requires service account for server)
// For web API key method, see tonDepositBot.ts

const PLATFORM_WALLET = process.env.PLATFORM_WALLET || 'UQD1Fm7uwhtWK9erHhUUKyPKUvm_X39cXJO_aeoaKL1YcMB5'
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL_MINUTES || '2')

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
  amount: number
  timestamp: number
}

// Simple version using Firebase REST API (no admin SDK needed)
class TonDepositBot {
  private firebaseConfig: any
  private db: any
  private isRunning = false

  constructor(firebaseConfig: any) {
    this.firebaseConfig = firebaseConfig
  }

  async findUserByWallet(walletAddress: string): Promise<any | null> {
    try {
      // Query Firestore via REST API
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${this.firebaseConfig.projectId}/databases/(default)/documents`
      const url = `${baseUrl}:runQuery`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'users' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'walletAddress' },
                op: 'EQUAL',
                value: { stringValue: walletAddress }
              }
            }
          }
        })
      })

      if (!response.ok) return null
      
      const data = await response.json()
      if (!data || !data.length || !data[0].document) return null
      
      const doc = data[0].document
      return {
        id: doc.name.split('/').pop(),
        ...this.convertFirestoreFields(doc.fields)
      }
    } catch (error) {
      console.error('Error finding user:', error)
      return null
    }
  }

  convertFirestoreFields(fields: any): any {
    const result: any = {}
    for (const [key, value] of Object.entries(fields)) {
      if (value.hasOwnProperty('stringValue')) {
        result[key] = (value as any).stringValue
      } else if (value.hasOwnProperty('integerValue')) {
        result[key] = parseInt((value as any).integerValue)
      } else if (value.hasOwnProperty('doubleValue')) {
        result[key] = (value as any).doubleValue
      } else if (value.hasOwnProperty('booleanValue')) {
        result[key] = (value as any).booleanValue
      } else if (value.hasOwnProperty('arrayValue')) {
        result[key] = (value as any).arrayValue.values?.map((v: any) => this.convertFirestoreFields({ temp: v }).temp) || []
      } else if (value.hasOwnProperty('mapValue')) {
        result[key] = this.convertFirestoreFields((value as any).mapValue.fields)
      }
    }
    return result
  }

  async fetchTonTransactions(address: string, limit: number = 20): Promise<TonTransaction[]> {
    try {
      const response = await fetch(`https://tonscan.org/api/accounts/${address}/transactions?limit=${limit}`)
      
      if (!response.ok) {
        console.error('Tonscan API error:', response.status)
        return []
      }
      
      const data = await response.json() as any[]
      
      return data
        .filter((tx: any) => tx && tx.in_msg && parseInt(tx.in_msg.value) > 0)
        .map((tx: any) => ({
          hash: tx.hash,
          from: tx.in_msg.source,
          to: tx.in_msg.destination,
          amount: parseFloat((parseInt(tx.in_msg.value) / 1e9).toFixed(3)),
          timestamp: tx.utime * 1000,
        }))
        .filter((tx: TonTransaction) => tx.amount >= 1 && tx.amount <= 1000)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      return []
    }
  }

  async isTransactionProcessed(txHash: string): Promise<boolean> {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.firebaseConfig.projectId}/databases/(default)/documents/processed_transactions/${txHash}`
      const response = await fetch(url)
      return response.ok
    } catch {
      return false
    }
  }

  async markTransactionProcessed(txHash: string, userId: string, amount: number, planId: string) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.firebaseConfig.projectId}/databases/(default)/documents/processed_transactions/${txHash}`
      
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            userId: { stringValue: userId },
            amount: { doubleValue: amount },
            planId: { stringValue: planId },
            processedAt: { timestampValue: new Date().toISOString() },
            txHash: { stringValue: txHash },
          }
        })
      })
    } catch (error) {
      console.error('Error marking transaction:', error)
    }
  }

  findPlanForAmount(amount: number) {
    for (const [id, plan] of Object.entries(PLANS)) {
      if (amount >= plan.min && amount <= plan.max) {
        return { id, plan }
      }
    }
    if (amount > PLANS.elite.max) {
      return { id: 'elite', plan: PLANS.elite }
    }
    return null
  }

  async createInvestment(userId: string, amount: number, planId: string): Promise<boolean> {
    try {
      const plan = PLANS[planId as keyof typeof PLANS]
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
        createdAt: new Date().toISOString(),
      }

      // Get user first
      const userUrl = `https://firestore.googleapis.com/v1/projects/${this.firebaseConfig.projectId}/databases/(default)/documents/users/${userId}`
      const userRes = await fetch(userUrl)
      
      if (!userRes.ok) {
        console.error('User not found:', userId)
        return false
      }

      const userData = await userRes.json()
      const fields = this.convertFirestoreFields(userData.fields)
      const currentInvestments = fields.investments || []

      // Update user
      await fetch(userUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            investments: {
              arrayValue: {
                values: [
                  ...currentInvestments.map((inv: any) => ({ mapValue: { fields: this.objToFirestoreFields(inv) } })),
                  { mapValue: { fields: this.objToFirestoreFields(investment) } }
                ]
              }
            },
            totalInvested: { doubleValue: (fields.totalInvested || 0) + amount },
            updatedAt: { timestampValue: new Date().toISOString() },
          }
        })
      })

      // Create transaction record
      const txUrl = `https://firestore.googleapis.com/v1/projects/${this.firebaseConfig.projectId}/databases/(default)/documents/transactions`
      await fetch(txUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            userId: { stringValue: userId },
            username: { stringValue: fields.username },
            type: { stringValue: 'deposit' },
            amount: { doubleValue: amount },
            status: { stringValue: 'completed' },
            date: { timestampValue: new Date().toISOString() },
            description: { stringValue: `Auto-invested ${amount} TON in ${plan.name} Plan` },
            autoProcessed: { booleanValue: true },
          }
        })
      })

      console.log(`✅ Created ${plan.name} plan for user ${userId}`)
      return true
    } catch (error) {
      console.error('Error creating investment:', error)
      return false
    }
  }

  objToFirestoreFields(obj: any): any {
    const fields: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        fields[key] = { stringValue: value }
      } else if (typeof value === 'number') {
        fields[key] = { doubleValue: value }
      } else if (typeof value === 'boolean') {
        fields[key] = { booleanValue: value }
      } else if (Array.isArray(value)) {
        fields[key] = { arrayValue: { values: value.map(v => ({ mapValue: { fields: this.objToFirestoreFields(v) } })) } }
      }
    }
    return fields
  }

  async processDeposits() {
    console.log('🔍 Checking for deposits...')
    
    const transactions = await this.fetchTonTransactions(PLATFORM_WALLET, 20)
    
    if (transactions.length === 0) {
      console.log('No new deposits')
      return
    }

    console.log(`Found ${transactions.length} transactions`)

    for (const tx of transactions) {
      const alreadyProcessed = await this.isTransactionProcessed(tx.hash)
      if (alreadyProcessed) {
        console.log(`Skipping processed tx: ${tx.hash.substring(0, 16)}...`)
        continue
      }

      const user = await this.findUserByWallet(tx.from)
      if (!user) {
        console.log(`No user for wallet: ${tx.from.substring(0, 16)}...`)
        continue
      }

      console.log(`🎯 ${user.username} deposited ${tx.amount} TON`)

      const planInfo = this.findPlanForAmount(tx.amount)
      if (!planInfo) {
        console.log(`No plan for ${tx.amount} TON`)
        continue
      }

      const success = await this.createInvestment(user.id, tx.amount, planInfo.id)
      if (success) {
        await this.markTransactionProcessed(tx.hash, user.id, tx.amount, planInfo.id)
        console.log(`✅ Processed ${user.username}'s deposit`)
      }
    }
  }

  start() {
    console.log('🤖 TON Deposit Bot Started')
    console.log(`💰 Monitoring: ${PLATFORM_WALLET}`)
    console.log(`⏱️ Checking every ${CHECK_INTERVAL} minutes`)

    this.processDeposits()
    setInterval(() => this.processDeposits(), CHECK_INTERVAL * 60 * 1000)
  }
}

// Start bot
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  apiKey: process.env.FIREBASE_API_KEY,
}

if (!firebaseConfig.projectId) {
  console.error('❌ FIREBASE_PROJECT_ID not set!')
  console.error('Please set environment variables:')
  console.error('  FIREBASE_PROJECT_ID=your_project_id')
  console.error('  FIREBASE_API_KEY=your_api_key (optional)')
  process.exit(1)
}

const bot = new TonDepositBot(firebaseConfig)
bot.start()
