import { useState, useEffect } from 'react'
import { useTelegram } from './hooks/useTelegram'
import Dashboard from './components/Dashboard'
import Invest from './components/Invest'
import Referrals from './components/Referrals'
import History from './components/History'
import Wallet from './components/Wallet'
import BottomNav from './components/BottomNav'
import { processReferralCode } from './services/referralService'
import { ValuesPage } from './adopt-me/pages/ValuesPage'
import { InventoryPage } from './adopt-me/pages/InventoryPage'
import { TradePage } from './adopt-me/pages/TradePage'
import { AdoptMeNav } from './adopt-me/components/AdoptMeNav'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [adoptMeTab, setAdoptMeTab] = useState('values')
  const { hideBackButton, initDataUnsafe, user } = useTelegram()

  useEffect(() => {
    hideBackButton()
  }, [hideBackButton])

  // Process referral code on app initialization
  useEffect(() => {
    const referralCode = initDataUnsafe?.start_param
    if (referralCode && user) {
      processReferralCode(referralCode, user.id.toString(), user.username || 'User')
    }
  }, [initDataUnsafe, user])

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />
      case 'invest': return <Invest />
      case 'wallet': return <Wallet />
      case 'referrals': return <Referrals />
      case 'history': return <History />
      case 'adoptme':
        return (
          <div className="h-full flex flex-col">
            <AdoptMeNav activeTab={adoptMeTab} onTabChange={setAdoptMeTab} />
            <div className="flex-1 overflow-y-auto">
              {adoptMeTab === 'values' && <ValuesPage />}
              {adoptMeTab === 'inventory' && <InventoryPage />}
              {adoptMeTab === 'trade' && <TradePage />}
            </div>
          </div>
        )
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex flex-col h-full w-full relative bg-ton-dark text-white overflow-hidden">
      <main className="flex-1 overflow-hidden">
        {renderTab()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
