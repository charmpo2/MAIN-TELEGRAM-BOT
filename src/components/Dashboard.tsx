import { useState, useEffect, useCallback } from 'react'
import { Wallet, TrendingUp, Clock, Zap, Gift, ChevronRight, RefreshCw, Timer, Coins } from 'lucide-react'
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react'
import { useTelegram } from '../hooks/useTelegram'
import {
  getInvestments,
  getTotalInvested,
  getTotalEverInvested,
  getTotalDailyReward,
  getTransactions,
  claimDailyRewards,
  getDailyReward,
  getGameBalance,
  canClaimRewards,
  checkAndUpdateExpiredPlans,
  getLastClaimTime,
  createInvestment,
  getPlans,
  type Investment,
  type InvestmentPlan,
} from '../services/investmentService'

export default function Dashboard() {
  const wallet = useTonWallet()
  const { user, hapticFeedback } = useTelegram()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [totalInvested, setTotalInvested] = useState(0)
  const [totalEverInvested, setTotalEverInvested] = useState(0)
  const [dailyReward, setDailyReward] = useState(0)
  const [gameBalance, setGameBalance] = useState(0)
  const [canClaim, setCanClaim] = useState(false)
  const [totalClaimedAmount, setTotalClaimedAmount] = useState(0)
  const [timeUntilClaim, setTimeUntilClaim] = useState('')
  const [showReinvestModal, setShowReinvestModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null)
  const [reinvestAmount, setReinvestAmount] = useState('')
  const [reinvestError, setReinvestError] = useState('')

  const refresh = useCallback(() => {
    checkAndUpdateExpiredPlans()
    setInvestments(getInvestments())
    setTotalInvested(getTotalInvested())
    setTotalEverInvested(getTotalEverInvested())
    setDailyReward(getTotalDailyReward())
    setGameBalance(getGameBalance())
    setCanClaim(canClaimRewards())
    const claimedTxns = getTransactions().filter(t => t.type === 'reward' && t.status === 'completed')
    setTotalClaimedAmount(claimedTxns.reduce((sum, t) => sum + t.amount, 0))
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(() => {
      refresh()
      updateCountdown()
    }, 1000)
    return () => clearInterval(interval)
  }, [refresh])

  // Countdown timer for next claim
  const updateCountdown = useCallback(() => {
    const lastClaim = getLastClaimTime()
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    const timeLeft = oneDay - (now - lastClaim)
    
    if (timeLeft <= 0) {
      setTimeUntilClaim('')
      return
    }
    
    const hours = Math.floor(timeLeft / (60 * 60 * 1000))
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000)
    setTimeUntilClaim(`${hours}h ${minutes}m ${seconds}s`)
  }, [])

  const handleClaim = () => {
    if (!canClaim || dailyReward <= 0) return
    const claimed = claimDailyRewards()
    if (claimed > 0) {
      hapticFeedback('success')
      refresh()
    }
  }

  const formatTon = (val: number) => val.toFixed(3)
  const username = user?.username || user?.first_name || 'Investor'

  // Reinvest functionality
  const handleReinvest = () => {
    if (gameBalance <= 0) {
      setReinvestError('No game balance available')
      return
    }
    const plans = getPlans()
    // Find plan that matches available balance
    const suitablePlan = plans.find(p => gameBalance >= p.minAmount && gameBalance <= p.maxAmount)
    if (suitablePlan) {
      setSelectedPlan(suitablePlan)
      setReinvestAmount(gameBalance.toString())
    } else if (gameBalance >= plans[plans.length - 1].minAmount) {
      setSelectedPlan(plans[plans.length - 1])
      setReinvestAmount(plans[plans.length - 1].maxAmount.toString())
    } else {
      setSelectedPlan(plans[0])
      setReinvestAmount(gameBalance.toString())
    }
    setShowReinvestModal(true)
    setReinvestError('')
  }

  const executeReinvest = () => {
    if (!selectedPlan || !reinvestAmount) return
    
    const amount = parseFloat(reinvestAmount)
    if (amount > gameBalance) {
      setReinvestError('Insufficient game balance')
      return
    }
    if (amount < selectedPlan.minAmount || amount > selectedPlan.maxAmount) {
      setReinvestError(`Amount must be between ${selectedPlan.minAmount} and ${selectedPlan.maxAmount} TON`)
      return
    }
    
    const investment = createInvestment(selectedPlan.id, amount)
    if (investment) {
      hapticFeedback('success')
      setShowReinvestModal(false)
      setReinvestAmount('')
      setReinvestError('')
      refresh()
    } else {
      setReinvestError('Failed to create investment')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-24 px-4 pt-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/60 text-sm">Welcome back,</p>
          <h2 className="text-white font-bold text-lg">{username}</h2>
        </div>
        <TonConnectButton className="ton-connect-btn" />
      </div>

      {/* Top Game Balance Bar */}
      <div className="sticky top-0 z-10 bg-ton-dark/90 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins size={20} className="text-ton-accent" />
          <span className="text-white/70 text-sm">Balance:</span>
          <span className="text-white font-bold">{formatTon(gameBalance)} TON</span>
        </div>
        {gameBalance > 0 && (
          <button
            onClick={handleReinvest}
            className="flex items-center gap-1 px-3 py-1.5 bg-ton-accent/20 text-ton-accent rounded-lg text-sm font-medium active:scale-95 transition-all"
          >
            <RefreshCw size={14} />
            Reinvest
          </button>
        )}
      </div>

      {/* Balance Card - Game Balance */}
      <div className="bg-gradient-to-br from-ton-blue/30 to-ton-accent/20 rounded-2xl p-5 border border-white/10 glow-effect">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-white/70">
            <Wallet size={16} />
            <span className="text-sm">Game Balance (Claimed)</span>
          </div>
        </div>
        <div className="text-3xl font-bold text-white mb-2">
          {formatTon(gameBalance)} <span className="text-ton-accent text-lg">TON</span>
        </div>
        <div className="flex items-center gap-2 text-ton-accent text-sm">
          <TrendingUp size={14} />
          <span>+{formatTon(dailyReward)} TON daily</span>
        </div>
      </div>

      {/* Total Invested Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-ton-card rounded-xl p-3 border border-white/10 text-center">
          <p className="text-white/50 text-xs mb-1">Active Invested</p>
          <p className="text-white font-bold text-lg">{formatTon(totalInvested)} TON</p>
        </div>
        <div className="bg-ton-card rounded-xl p-3 border border-white/10 text-center">
          <p className="text-white/50 text-xs mb-1">Total Ever Invested</p>
          <p className="text-white font-bold text-lg">{formatTon(totalEverInvested)} TON</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleClaim}
          disabled={!canClaim || dailyReward <= 0}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
            !canClaim || dailyReward <= 0
              ? 'bg-white/5 border-white/5 text-white/30'
              : 'bg-ton-accent/20 border-ton-accent/30 text-ton-accent active:scale-95'
          }`}
        >
          <Zap size={24} />
          <span className="text-sm font-medium">
            {!canClaim ? 'Claimed Today' : 'Claim Reward'}
          </span>
          {!canClaim && timeUntilClaim && (
            <span className="text-xs text-white/40 flex items-center gap-1">
              <Timer size={12} />
              {timeUntilClaim}
            </span>
          )}
        </button>
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 text-white/70">
          <Gift size={24} />
          <span className="text-sm font-medium">{investments.length} Active Plans</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-ton-card rounded-xl p-3 border border-white/5 text-center">
          <p className="text-white/50 text-xs mb-1">Active</p>
          <p className="text-white font-bold text-lg">{investments.filter(i => i.status === 'active').length}</p>
        </div>
        <div className="bg-ton-card rounded-xl p-3 border border-white/5 text-center">
          <p className="text-white/50 text-xs mb-1">Completed</p>
          <p className="text-white font-bold text-lg">{investments.filter(i => i.status === 'completed').length}</p>
        </div>
        <div className="bg-ton-card rounded-xl p-3 border border-white/5 text-center">
          <p className="text-white/50 text-xs mb-1">Claimed</p>
          <p className="text-white font-bold text-lg">{formatTon(totalClaimedAmount)}</p>
        </div>
      </div>

      {/* Active Investments */}
      <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Clock size={16} className="text-ton-accent" />
          Active Investments
        </h3>
        {investments.filter(i => i.status === 'active').length === 0 ? (
          <div className="bg-ton-card rounded-xl p-6 border border-white/5 text-center text-white/50">
            <p className="text-sm">No active investments yet.</p>
            <p className="text-xs mt-1">Go to Invest tab to start earning!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {investments.filter(i => i.status === 'active').map(inv => {
              const daily = getDailyReward(inv)
              const daysElapsed = Math.floor(
                (Date.now() - new Date(inv.startDate).getTime()) / 86400000
              )
              const progress = Math.min(
                ((inv.claimedReward + daily * daysElapsed) / inv.totalReward) * 100,
                100
              )
              return (
                <div
                  key={inv.id}
                  className="bg-ton-card rounded-xl p-4 border border-white/5"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white font-medium text-sm">{inv.planId.toUpperCase()} Plan</p>
                      <p className="text-white/50 text-xs">{inv.amount} TON invested</p>
                    </div>
                    <span className="text-ton-accent text-xs font-medium bg-ton-accent/10 px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                      <span>Progress</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-ton-blue to-ton-accent rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-white/50">
                    <span>+{formatTon(daily)} TON/day</span>
                    <span className="flex items-center gap-1">
                      {formatTon(inv.claimedReward)} / {formatTon(inv.totalReward)} TON
                      <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {!wallet && (
        <div className="bg-ton-blue/10 border border-ton-blue/20 rounded-xl p-4 text-center mt-2">
          <p className="text-white/70 text-sm mb-2">Connect your TON wallet to start investing</p>
          <TonConnectButton className="ton-connect-btn" />
        </div>
      )}

      {/* Reinvest Modal */}
      {showReinvestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-ton-card rounded-2xl p-6 border border-white/10 w-full max-w-sm">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <RefreshCw size={20} className="text-ton-accent" />
              Reinvest Game Balance
            </h3>
            
            <div className="mb-4">
              <p className="text-white/50 text-sm mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-white">{formatTon(gameBalance)} TON</p>
            </div>

            {selectedPlan && (
              <div className="mb-4">
                <p className="text-white/50 text-sm mb-2">Selected Plan</p>
                <div className="bg-ton-dark rounded-lg p-3 border border-white/10">
                  <p className="text-white font-medium">{selectedPlan.name} Plan</p>
                  <p className="text-white/50 text-xs">
                    Min: {selectedPlan.minAmount} TON | {selectedPlan.dailyRate * 100}%/day
                  </p>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="text-white/50 text-sm mb-2 block">Investment Amount</label>
              <input
                type="number"
                value={reinvestAmount}
                onChange={(e) => setReinvestAmount(e.target.value)}
                className="w-full bg-ton-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30"
                placeholder="Enter amount"
                min={selectedPlan?.minAmount || 0}
                max={Math.min(gameBalance, selectedPlan?.maxAmount || gameBalance)}
                step="0.001"
              />
            </div>

            {reinvestError && (
              <p className="text-red-400 text-sm mb-4">{reinvestError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowReinvestModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-white/70 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={executeReinvest}
                disabled={!reinvestAmount || parseFloat(reinvestAmount) <= 0}
                className="flex-1 py-3 rounded-xl bg-ton-accent text-ton-dark font-medium disabled:opacity-50"
              >
                Reinvest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
