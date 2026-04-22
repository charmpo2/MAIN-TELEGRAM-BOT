import { useState, useEffect } from 'react'
import { subscribeToAdminSettings, type AdminSettings } from '../services/firestoreService'

const defaultSettings: AdminSettings = {
  maintenanceMode: false,
  minDeposit: 1,
  minWithdrawal: 10,
  withdrawalFee: 0.5
}

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAdminSettings((newSettings) => {
      setSettings(newSettings)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { settings, loading }
}
