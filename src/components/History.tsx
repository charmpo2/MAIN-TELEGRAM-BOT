import { ArrowDownLeft, ArrowUpRight, Gift, Users } from 'lucide-react'
import { getTransactions, type Transaction } from '../services/investmentService'

export default function History() {
  const transactions = getTransactions()

  const getIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft size={18} className="text-green-400" />
      case 'withdraw': return <ArrowUpRight size={18} className="text-red-400" />
      case 'reward': return <Gift size={18} className="text-ton-accent" />
      case 'referral': return <Users size={18} className="text-purple-400" />
      default: return <ArrowDownLeft size={18} className="text-white/50" />
    }
  }

  const getColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return 'text-green-400'
      case 'withdraw': return 'text-red-400'
      case 'reward': return 'text-ton-accent'
      case 'referral': return 'text-purple-400'
      default: return 'text-white'
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-24 px-4 pt-4 gap-4">
      <h2 className="text-white font-bold text-xl">History</h2>

      {transactions.length === 0 ? (
        <div className="bg-ton-card rounded-xl p-8 border border-white/5 text-center">
          <p className="text-white/40 text-sm">No transactions yet.</p>
          <p className="text-white/30 text-xs mt-1">Start investing to see your history.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {transactions.map(tx => (
            <div key={tx.id} className="bg-ton-card rounded-xl p-4 border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                {getIcon(tx.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium capitalize">{tx.type}</p>
                <p className="text-white/40 text-xs truncate">{tx.description || tx.type}</p>
                <p className="text-white/30 text-[10px] mt-0.5">
                  {new Date(tx.date).toLocaleString()}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-semibold ${getColor(tx.type)}`}>
                  {tx.type === 'withdraw' ? '-' : '+'}{tx.amount.toFixed(4)} TON
                </p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  tx.status === 'completed'
                    ? 'bg-green-500/10 text-green-400'
                    : tx.status === 'pending'
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
