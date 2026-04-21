import { Search, Package, Scale } from 'lucide-react';

interface AdoptMeNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AdoptMeNav({ activeTab, onTabChange }: AdoptMeNavProps) {
  const tabs = [
    { id: 'values', label: 'Values', icon: Search },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'trade', label: 'Trade', icon: Scale },
  ];

  return (
    <nav className="sticky top-0 bg-ton-card/95 backdrop-blur-sm border-b border-white/10 z-40">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                isActive
                  ? 'text-ton-accent bg-ton-accent/10'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
