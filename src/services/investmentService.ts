import { getReferredBy, creditReferralCommission } from './referralService'

const STORAGE_PREFIX = 'ton_invest_'

export interface InvestmentPlan {
  id: string
  name: string
  minAmount: number
  maxAmount: number
  dailyRate: number
  duration: number
}

export interface Investment {
  id: string
  planId: string
  amount: number
  startDate: string
  endDate: string
  totalReward: number
  claimedReward: number
  status: 'active' | 'completed'
}

export interface Transaction {
  id: string
  type: 'deposit' | 'withdraw' | 'reward' | 'referral'
  amount: number
  date: string
  status: 'pending' | 'completed' | 'failed'
  description?: string
}

export interface ReferralData {
  code: string
  referrals: {
    id: string
    username: string
    joinedAt: string
    investedAmount: number
    earnedCommission: number
  }[]
  totalCommission: number
  referralCount: number
}

const PLANS: InvestmentPlan[] = [
  { id: 'starter', name: 'Starter', minAmount: 1, maxAmount: 10, dailyRate: 0.005, duration: 30 },
  { id: 'growth', name: 'Growth', minAmount: 10, maxAmount: 50, dailyRate: 0.007, duration: 45 },
  { id: 'premium', name: 'Premium', minAmount: 50, maxAmount: 200, dailyRate: 0.01, duration: 60 },
  { id: 'elite', name: 'Elite', minAmount: 200, maxAmount: 1000, dailyRate: 0.015, duration: 90 },
]

function getStorageKey(key: string) {
  return STORAGE_PREFIX + key
}

function getWalletKey(): string {
  return 'default_user'
}

export function getPlans(): InvestmentPlan[] {
  return PLANS
}

export function generateReferralCode(walletAddress?: string): string {
  const base = walletAddress || Math.random().toString(36).substring(2, 10)
  return 'TON' + base.slice(-6).toUpperCase()
}

export function getReferralData(walletAddress?: string): ReferralData {
  const key = getStorageKey('referrals_' + getWalletKey())
  const stored = localStorage.getItem(key)
  if (stored) return JSON.parse(stored)

  const code = generateReferralCode(walletAddress)
  const data: ReferralData = {
    code,
    referrals: [],
    totalCommission: 0,
    referralCount: 0,
  }
  localStorage.setItem(key, JSON.stringify(data))
  return data
}

export function addReferral(walletAddress: string | undefined, refData: Partial<ReferralData['referrals'][0]>) {
  const data = getReferralData(walletAddress)
  data.referrals.push({
    id: Math.random().toString(36).substring(2, 10),
    username: refData.username || 'User',
    joinedAt: new Date().toISOString(),
    investedAmount: refData.investedAmount || 0,
    earnedCommission: refData.earnedCommission || 0,
  })
  data.referralCount = data.referrals.length
  data.totalCommission = data.referrals.reduce((sum, r) => sum + r.earnedCommission, 0)
  localStorage.setItem(getStorageKey('referrals_' + getWalletKey()), JSON.stringify(data))
  return data
}

export function getInvestments(): Investment[] {
  const key = getStorageKey('investments_' + getWalletKey())
  const stored = localStorage.getItem(key)
  return stored ? JSON.parse(stored) : []
}

export function createInvestment(planId: string, amount: number): Investment | null {
  const plan = PLANS.find(p => p.id === planId)
  if (!plan) return null
  if (amount < plan.minAmount || amount > plan.maxAmount) return null

  const now = new Date()
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + plan.duration)

  const investment: Investment = {
    id: Math.random().toString(36).substring(2, 10),
    planId: plan.id,
    amount,
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    totalReward: amount * plan.dailyRate * plan.duration,
    claimedReward: 0,
    status: 'active',
  }

  const investments = getInvestments()
  investments.push(investment)
  localStorage.setItem(getStorageKey('investments_' + getWalletKey()), JSON.stringify(investments))

  addTransaction({
    id: Math.random().toString(36).substring(2, 10),
    type: 'deposit',
    amount,
    date: now.toISOString(),
    status: 'completed',
    description: `Invested in ${plan.name} Plan`,
  })

  // Process referral commission if user was referred
  const referrerCode = getReferredBy()
  if (referrerCode) {
    creditReferralCommission(referrerCode, amount, 'user', 'User')
      .then(() => {
        console.log('Referral commission processed for:', referrerCode)
      })
      .catch((err: Error) => {
        console.error('Failed to process referral commission:', err)
      })
  }

  return investment
}

export function getTransactions(): Transaction[] {
  const key = getStorageKey('transactions_' + getWalletKey())
  const stored = localStorage.getItem(key)
  return stored ? JSON.parse(stored) : []
}

export function addTransaction(tx: Transaction) {
  const transactions = getTransactions()
  transactions.unshift(tx)
  localStorage.setItem(getStorageKey('transactions_' + getWalletKey()), JSON.stringify(transactions))
}

export function getDailyReward(investment: Investment): number {
  const plan = PLANS.find(p => p.id === investment.planId)
  if (!plan) return 0
  return investment.amount * plan.dailyRate
}

export function getTotalInvested(): number {
  return getInvestments()
    .filter(i => i.status === 'active')
    .reduce((sum, i) => sum + i.amount, 0)
}

export function getTotalEverInvested(): number {
  return getInvestments()
    .reduce((sum, i) => sum + i.amount, 0)
}

export function getTotalDailyReward(): number {
  return getInvestments()
    .filter(i => i.status === 'active')
    .reduce((sum, i) => sum + getDailyReward(i), 0)
}

export function checkAndUpdateExpiredPlans(): void {
  const investments = getInvestments()
  const now = new Date()
  let updated = false

  investments.forEach(inv => {
    if (inv.status === 'active' && new Date(inv.endDate) <= now) {
      inv.status = 'completed'
      updated = true
    }
  })

  if (updated) {
    localStorage.setItem(getStorageKey('investments_' + getWalletKey()), JSON.stringify(investments))
  }
}

export function getGameBalance(): number {
  return getTransactions()
    .filter(t => t.type === 'reward' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
}

export function getLastClaimTime(): number {
  const key = getStorageKey('last_claim_' + getWalletKey())
  const stored = localStorage.getItem(key)
  return stored ? parseInt(stored, 10) : 0
}

export function canClaimRewards(): boolean {
  const lastClaim = getLastClaimTime()
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  return now - lastClaim >= oneDay
}

export function claimDailyRewards(): number {
  if (!canClaimRewards()) return 0

  checkAndUpdateExpiredPlans()

  const investments = getInvestments().filter(i => i.status === 'active')
  if (investments.length === 0) return 0

  let totalClaimed = 0

  investments.forEach(inv => {
    const daily = getDailyReward(inv)
    inv.claimedReward += daily
    totalClaimed += daily

    if (inv.claimedReward >= inv.totalReward) {
      inv.status = 'completed'
    }
  })

  if (totalClaimed > 0) {
    localStorage.setItem(getStorageKey('investments_' + getWalletKey()), JSON.stringify(getInvestments()))
    localStorage.setItem(getStorageKey('last_claim_' + getWalletKey()), Date.now().toString())
    addTransaction({
      id: Math.random().toString(36).substring(2, 10),
      type: 'reward',
      amount: totalClaimed,
      date: new Date().toISOString(),
      status: 'completed',
      description: 'Daily reward claim',
    })
  }

  return totalClaimed
}

export function getReferralLink(code: string): string {
  const botUsername = 'TON_SPACES_BOT'
  return `https://t.me/${botUsername}?start=${code}`
}
