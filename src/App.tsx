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
import { subscribeToAdminSettings, type AdminSettings } from './services/firestoreService'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const { hideBackButton, initDataUnsafe, user } = useTelegram()

  useEffect(() => {
    hideBackButton()
  }, [hideBackButton])

  // Subscribe to settings from Firebase
  const [settings, setSettings] = useState<AdminSettings>({
    maintenanceMode: false,
    minDeposit: 1,
    minWithdrawal: 10,
    withdrawalFee: 0.5
  })
  
  useEffect(() => {
    console.log('[Maintenance] Subscribing to settings...')
    const unsubscribe = subscribeToAdminSettings((newSettings) => {
      console.log('[Maintenance] Settings received:', newSettings)
      setSettings(newSettings)
      setMaintenanceMode(newSettings.maintenanceMode)
    })
    return () => {
      console.log('[Maintenance] Unsubscribing...')
      unsubscribe()
    }
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
      {/* Maintenance status indicator - always visible for debugging */}
      <div className={`fixed top-0 right-0 text-[10px] px-2 py-1 z-50 ${
        maintenanceMode ? 'bg-red-500/80 text-white' : 'bg-black/50 text-white/50'
      }`}>
        Maint: {maintenanceMode ? 'ON' : 'OFF'}
      </div>
    </div>
  )
}
