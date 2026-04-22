import { AlertTriangle, Wrench } from 'lucide-react'

export default function MaintenanceScreen() {
  return (
    <div className="fixed inset-0 bg-ton-dark flex flex-col items-center justify-center p-6 z-50">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
          <Wrench size={48} className="text-yellow-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-white">
          Under Maintenance
        </h1>
        
        <p className="text-white/60 text-sm leading-relaxed">
          We're currently performing updates to improve your experience. 
          Please check back soon. Thank you for your patience!
        </p>
        
        <div className="flex items-center justify-center gap-2 text-yellow-400/80 text-xs">
          <AlertTriangle size={14} />
          <span>Platform temporarily unavailable</span>
        </div>
      </div>
    </div>
  )
}
