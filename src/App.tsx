import { useState, useEffect } from 'react'
import { useTelegram } from './hooks/useTelegram'
import Dashboard from './components/Dashboard'
import Invest from './components/Invest'
import Referrals from './components/Referrals'
import History from './components/History'
import Wallet from './components/Wallet'
import BottomNav from './components/BottomNav'
import MaintenanceScreen from './components/MaintenanceScreen'
import { processReferralCode } from './services/referralService'
import { subscribeToAdminSettings } from './services/firestoreService'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const { hideBackButton, initDataUnsafe, user } = useTelegram()

  useEffect(() => {
    hideBackButton()
  }, [hideBackButton])

  // Subscribe to maintenance mode from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToAdminSettings((settings) => {
      setMaintenanceMode(settings.maintenanceMode)
    })
    return () => unsubscribe()
  }, [])

  // Process referral code on app initialization
  useEffect(() => {
    const referralCode = initDataUnsafe?.start_param
    if (referralCode && user) {
      processReferralCode(referralCode, user.id.toString(), user.username || 'User')
    }
  }, [initDataUnsafe, user])

  // Show maintenance screen if enabled
  if (maintenanceMode) {
    return <MaintenanceScreen />
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />
      case 'invest': return <Invest />
      case 'wallet': return <Wallet />
      case 'referrals': return <Referrals />
      case 'history': return <History />
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex flex-col h-full w-full relative bg-ton-dark text-white overflow-hidden">
      <main className="flex-1 overflow-hidden">
        {renderTab()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      {/* Debug indicator - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-0 right-0 bg-black/50 text-white/50 text-[10px] px-2 py-1">
          Maint: {maintenanceMode ? 'ON' : 'OFF'}
        </div>
      )}
    </div>
  )
}
