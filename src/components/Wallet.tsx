import { useState, useCallback } from 'react'
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Send, AlertTriangle, CheckCircle2, Copy, Info } from 'lucide-react'
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react'
import { useTelegram } from '../hooks/useTelegram'
import { useAdminSettings } from '../hooks/useAdminSettings'
import { getTransactions, addTransaction } from '../services/investmentService'

export default function Wallet() {
  const wallet = useTonWallet()
  const { webApp, hapticFeedback } = useTelegram()
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { settings } = useAdminSettings()

  const transactions = getTransactions().filter(t => t.type === 'withdraw' || t.type === 'deposit')

  const balance = transactions.reduce((acc, t) => {
    if (t.type === 'deposit') return acc + t.amount
    if (t.type === 'withdraw') return acc - t.amount
    return acc
  }, 0)

  const handleCopyAddress = useCallback(() => {
    if (!wallet?.account?.address) return
    navigator.clipboard.writeText(wallet.account.address)
    hapticFeedback('success')
    if (webApp) {
      webApp.showPopup({ title: 'Copied!', message: 'Wallet address copied to clipboard' })
    }
  }, [wallet, hapticFeedback, webApp])

  const handleWithdraw = async () => {
    setError('')
    setSuccess('')
    
    if (!wallet) {
      setError('Please connect your TON wallet first')
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (numAmount < settings.minWithdrawal) {
      setError(`Minimum withdrawal is ${settings.minWithdrawal} TON`)
      return
    }

    if (numAmount > balance) {
      setError('Insufficient balance')
      return
    }

    if (!address || address.length < 10) {
      setError('Please enter a valid TON address')
      return
    }

    setLoading(true)

    await new Promise(resolve => setTimeout(resolve, 1500))

    addTransaction({
      id: Math.random().toString(36).substring(2, 10),
      type: 'withdraw',
      amount: numAmount,
      date: new Date().toISOString(),
      status: 'completed',
      description: `Withdraw to ${address.slice(0, 8)}...${address.slice(-4)}`,
    })

    hapticFeedback('success')
    setSuccess(`Successfully sent ${numAmount} TON to ${address.slice(0, 8)}...${address.slice(-4)}`)
    setAmount('')
    setAddress('')
    setLoading(false)

    setTimeout(() => setSuccess(''), 4000)
  }

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-24 px-4 pt-4 gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-xl">Wallet</h2>
        <TonConnectButton className="ton-connect-btn" />
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-ton-blue/30 to-ton-accent/20 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-2 text-white/70 mb-2">
          <WalletIcon size={18} />
          <span className="text-sm">Available Balance</span>
        </div>
        <div className="text-4xl font-bold text-white mb-1">
          {Math.max(0, balance).toFixed(4)}
          <span className="text-ton-accent text-lg ml-2">TON</span>
        </div>
        <p className="text-white/50 text-xs">
          {wallet?.account?.address ? (
            <span className="flex items-center gap-2">
              {shortenAddress(wallet.account.address)}
              <button onClick={handleCopyAddress} className="text-ton-accent hover:text-white transition-colors">
                <Copy size={12} />
              </button>
            </span>
          ) : 'Connect wallet to see address'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-ton-card rounded-xl p-3 border border-white/5 text-center">
          <ArrowDownLeft size={20} className="text-green-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">
            {transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0).toFixed(2)}
          </p>
          <p className="text-white/50 text-xs">Total Deposited</p>
        </div>
        <div className="bg-ton-card rounded-xl p-3 border border-white/5 text-center">
          <ArrowUpRight size={20} className="text-red-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">
            {transactions.filter(t => t.type === 'withdraw').reduce((s, t) => s + t.amount, 0).toFixed(2)}
          </p>
          <p className="text-white/50 text-xs">Total Withdrawn</p>
        </div>
      </div>

      {/* Withdraw Form */}
      {wallet && (
        <div className="bg-ton-card rounded-xl p-4 border border-white/10">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Send size={16} className="text-ton-accent" />
            Withdraw TON
          </h3>

          {/* Min Withdrawal & Fee Info */}
          <div className="bg-ton-card/50 border border-white/10 rounded-lg p-3 flex items-start gap-2 mb-3">
            <Info size={16} className="text-ton-accent shrink-0 mt-0.5" />
            <div className="text-xs text-white/60">
              <p>Minimum withdrawal: <span className="text-ton-accent font-medium">{settings.minWithdrawal} TON</span></p>
              <p className="mt-0.5">Fee: <span className="text-ton-accent font-medium">{settings.withdrawalFee} TON</span></p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Recipient Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="EQ... or UQ..."
                className="w-full bg-ton-dark/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-ton-accent/50"
              />
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Amount (TON)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={balance}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder={`Max: ${Math.max(0, balance).toFixed(2)}`}
                  className="w-full bg-ton-dark/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-ton-accent/50"
                />
                <button
                  onClick={() => setAmount(balance.toString())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-medium text-ton-accent bg-ton-accent/10 rounded hover:bg-ton-accent/20 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 flex gap-2 text-red-300 text-xs">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2.5 flex gap-2 text-green-300 text-xs">
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                {success}
              </div>
            )}

            <button
              onClick={handleWithdraw}
              disabled={loading || !amount || !address}
              className={`w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                loading
                  ? 'bg-white/10 text-white/50 cursor-wait'
                  : amount && address
                  ? 'bg-ton-accent text-ton-dark active:scale-[0.98]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-ton-dark/30 border-t-ton-dark rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Withdraw TON
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {!wallet && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
          <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-200 text-sm font-medium">Wallet Required</p>
            <p className="text-amber-200/70 text-xs mt-1">
              Connect your TON wallet to view balance and make withdrawals.
            </p>
          </div>
        </div>
      )}

      {/* Recent Wallet Transactions */}
      <div>
        <h3 className="text-white font-semibold text-sm mb-3">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <div className="bg-ton-card rounded-xl p-6 border border-white/5 text-center text-white/50 text-sm">
            No transactions yet
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="bg-ton-card rounded-lg p-3 border border-white/5 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  tx.type === 'withdraw' ? 'bg-red-500/10' : 'bg-green-500/10'
                }`}>
                  {tx.type === 'withdraw' ? (
                    <ArrowUpRight size={16} className="text-red-400" />
                  ) : (
                    <ArrowDownLeft size={16} className="text-green-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium capitalize">{tx.type}</p>
                  <p className="text-white/40 text-xs truncate">{tx.description || tx.type}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${tx.type === 'withdraw' ? 'text-red-400' : 'text-green-400'}`}>
                    {tx.type === 'withdraw' ? '-' : '+'}{tx.amount.toFixed(4)} TON
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-white/30 text-xs text-center">
        Withdrawals are processed instantly. Network fees apply.
      </p>
    </div>
  )
}
