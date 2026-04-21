import { useState, useCallback } from 'react'
import { Copy, Check, Users, TrendingUp, Share2, Gift } from 'lucide-react'
import { useTonWallet } from '@tonconnect/ui-react'
import { useTelegram } from '../hooks/useTelegram'
import { getReferralData, getReferralLink } from '../services/investmentService'

export default function Referrals() {
  const wallet = useTonWallet()
  const { webApp, hapticFeedback } = useTelegram()
  const [copied, setCopied] = useState(false)
  const referralData = getReferralData(wallet?.account?.address)

  const handleCopy = useCallback(() => {
    const link = getReferralLink(referralData.code)
    navigator.clipboard.writeText(link).catch(() => {})
    if (webApp) {
      webApp.showPopup({ title: 'Copied!', message: 'Referral link copied to clipboard' })
    }
    hapticFeedback('success')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [referralData.code, webApp, hapticFeedback])

  const handleShare = useCallback(() => {
    const link = getReferralLink(referralData.code)
    const text = `Join TON Spacer and earn daily rewards! Use my referral link: ${link}`
    if (webApp) {
      webApp.openLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`)
    } else {
      navigator.share?.({ title: 'TON Spacer', text, url: link }).catch(() => {})
    }
    hapticFeedback('light')
  }, [referralData.code, webApp, hapticFeedback])

  const link = getReferralLink(referralData.code)

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-24 px-4 pt-4 gap-4">
      <h2 className="text-white font-bold text-xl">Referrals</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-ton-card rounded-xl p-4 border border-white/10 text-center">
          <Users size={20} className="text-ton-accent mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{referralData.referralCount}</p>
          <p className="text-white/50 text-xs">Total Referrals</p>
        </div>
        <div className="bg-ton-card rounded-xl p-4 border border-white/10 text-center">
          <TrendingUp size={20} className="text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{referralData.totalCommission.toFixed(3)}</p>
          <p className="text-white/50 text-xs">TON Earned</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-ton-blue/20 to-ton-accent/10 rounded-xl p-5 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Gift size={18} className="text-ton-accent" />
          <span className="text-white font-semibold text-sm">Your Referral Link</span>
        </div>
        <div className="bg-ton-dark/50 rounded-lg p-3 mb-3 break-all">
          <p className="text-white/80 text-xs font-mono">{link}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-ton-accent/20 border border-ton-accent/30 text-ton-accent text-sm font-medium active:scale-95 transition-all"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium active:scale-95 transition-all"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>

      <div className="bg-ton-card rounded-xl p-4 border border-white/10">
        <h3 className="text-white font-semibold text-sm mb-3">Referral Program Benefits</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-ton-accent/10 flex items-center justify-center shrink-0">
              <span className="text-ton-accent text-xs font-bold">5%</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">Direct Referral Bonus</p>
              <p className="text-white/50 text-xs">Earn 5% of every deposit made by users you invite directly.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-ton-accent/10 flex items-center justify-center shrink-0">
              <span className="text-ton-accent text-xs font-bold">2%</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">Second Level</p>
              <p className="text-white/50 text-xs">Earn 2% from referrals made by your direct referrals.</p>
            </div>
          </div>
        </div>
      </div>

      {referralData.referrals.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-sm mb-3">Recent Referrals</h3>
          <div className="flex flex-col gap-2">
            {referralData.referrals.slice(0, 5).map(ref => (
              <div key={ref.id} className="bg-ton-card rounded-lg p-3 border border-white/5 flex justify-between items-center">
                <div>
                  <p className="text-white text-sm font-medium">@{ref.username}</p>
                  <p className="text-white/40 text-xs">{new Date(ref.joinedAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-ton-accent text-sm font-medium">+{ref.earnedCommission.toFixed(3)} TON</p>
                  <p className="text-white/40 text-xs">{ref.investedAmount.toFixed(2)} invested</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
