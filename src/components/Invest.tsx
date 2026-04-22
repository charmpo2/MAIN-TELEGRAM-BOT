import { useState } from 'react'
import { ArrowRight, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { TonConnectButton, useTonWallet, useTonConnectUI } from '@tonconnect/ui-react'
import { useTelegram } from '../hooks/useTelegram'
import { useAdminSettings } from '../hooks/useAdminSettings'
import { getPlans, createInvestment } from '../services/investmentService'
import { toNano } from '@ton/ton'

// Platform wallet address where investments are sent
const PLATFORM_WALLET = 'UQD1Fm7uwhtWK9erHhUUKyPKUvm_X39cXJO_aeoaKL1YcMB5'

export default function Invest() {
  const wallet = useTonWallet()
  const { hapticFeedback } = useTelegram()
  const [tonConnectUI] = useTonConnectUI()
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { settings } = useAdminSettings()

  const plans = getPlans()
  const plan = plans.find(p => p.id === selectedPlan)

  const handleInvest = async () => {
    setError('')
    setSuccess(false)

    if (!wallet || !tonConnectUI?.connected) {
      setError('Please connect your TON wallet first')
      return
    }

    if (!plan) {
      setError('Please select a plan')
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < plan.minAmount || numAmount > plan.maxAmount) {
      setError(`Amount must be between ${plan.minAmount} and ${plan.maxAmount} TON`)
      return
    }

    setLoading(true)

    try {
      // Convert TON to nanoTON (1 TON = 1e9 nanoTON)
      const amountNano = toNano(numAmount.toString())

      // Send transaction through TON Connect
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
          {
            address: PLATFORM_WALLET,
            amount: amountNano.toString(),
            payload: `invest:${plan.id}:${numAmount}`, // Memo with plan info
          },
        ],
      }

      // This will open the user's wallet for confirmation
      const result = await tonConnectUI.sendTransaction(transaction)

      // If transaction was sent successfully, create the investment
      if (result) {
        const investment = createInvestment(plan.id, numAmount)
        if (!investment) {
          setError('Payment sent but failed to create investment record. Contact support.')
          setLoading(false)
          return
        }

        hapticFeedback('success')
        setSuccess(true)
        setAmount('')
        setSelectedPlan('')
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err: any) {
      console.error('Transaction error:', err)
      if (err.message?.includes('cancelled') || err.message?.includes('rejected')) {
        setError('Transaction was cancelled in your wallet')
      } else {
        setError('Transaction failed. Please try again or check your wallet balance.')
      }
    } finally {
      setLoading(false)
    }
  }

  const estimatedReturn = plan && amount ? parseFloat(amount) * plan.dailyRate * plan.duration : 0
  const dailyReturn = plan && amount ? parseFloat(amount) * plan.dailyRate : 0

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-24 px-4 pt-4 gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-xl">Invest TON</h2>
        <TonConnectButton className="ton-connect-btn" />
      </div>

      {!wallet && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
          <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-200 text-sm font-medium">Wallet Required</p>
            <p className="text-amber-200/70 text-xs mt-1">
              Connect your TON wallet to make investments. This is a demo prototype — real TON transactions require smart contract integration.
            </p>
          </div>
        </div>
      )}

      {/* Min Deposit Info */}
      <div className="bg-ton-card/50 border border-white/10 rounded-lg p-3 flex items-center gap-2">
        <Info size={16} className="text-ton-accent shrink-0" />
        <p className="text-white/60 text-xs">
          Minimum deposit: <span className="text-ton-accent font-medium">{settings.minDeposit} TON</span>
        </p>
      </div>

      {/* Investment Plans */}
      <div>
        <p className="text-white/60 text-sm mb-3">Select a plan</p>
        <div className="grid grid-cols-2 gap-3">
          {plans.map(p => {
            const isSelected = selectedPlan === p.id
            return (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPlan(p.id)
                  setError('')
                  hapticFeedback('light')
                }}
                className={`relative p-4 rounded-xl border text-left transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-ton-accent/20 border-ton-accent/50'
                    : 'bg-ton-card border-white/10 hover:border-white/20'
                }`}
              >
                <p className={`font-bold text-sm ${isSelected ? 'text-ton-accent' : 'text-white'}`}>
                  {p.name}
                </p>
                <p className="text-white/50 text-xs mt-1">
                  {p.minAmount} - {p.maxAmount} TON
                </p>
                <p className="text-ton-accent text-xs mt-2 font-medium">
                  {(p.dailyRate * 100).toFixed(2)}% / day
                </p>
                <p className="text-white/40 text-[10px]">{p.duration} days</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Amount Input */}
      {selectedPlan && plan && (
        <div className="animate-fade-in">
          <p className="text-white/60 text-sm mb-2">Investment Amount</p>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min={plan.minAmount}
              max={plan.maxAmount}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`${plan.minAmount} - ${plan.maxAmount}`}
              className="w-full bg-ton-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-ton-accent/50 text-sm"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-medium">
              TON
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            {[plan.minAmount, (plan.minAmount + plan.maxAmount) / 2, plan.maxAmount].map(v => (
              <button
                key={v}
                onClick={() => setAmount(v.toString())}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs border border-white/10 hover:bg-white/10 transition-colors"
              >
                {v} TON
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Estimate */}
      {plan && amount && parseFloat(amount) > 0 && (
        <div className="bg-ton-card rounded-xl p-4 border border-white/10">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/60">Daily Return</span>
            <span className="text-ton-accent font-medium">+{dailyReturn.toFixed(4)} TON</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/60">Total Return ({plan.duration} days)</span>
            <span className="text-ton-accent font-medium">+{estimatedReturn.toFixed(3)} TON</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Net Profit</span>
            <span className="text-green-400 font-medium">
              +{((estimatedReturn / parseFloat(amount)) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-2 text-green-300 text-sm">
          <CheckCircle2 size={16} />
          Investment created successfully!
        </div>
      )}

      <button
        onClick={handleInvest}
        disabled={!wallet || !plan || !amount || loading}
        className={`mt-2 w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          loading
            ? 'bg-white/10 text-white/50 cursor-wait'
            : wallet && plan && amount
            ? 'bg-ton-accent text-ton-dark active:scale-[0.98]'
            : 'bg-white/10 text-white/30 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-ton-dark/30 border-t-ton-dark rounded-full animate-spin" />
            Sending to Wallet...
          </>
        ) : (
          <>
            Invest Now
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <p className="text-white/30 text-xs text-center">
        All investments are subject to platform terms. Daily rewards are distributed automatically.
      </p>
    </div>
  )
}
