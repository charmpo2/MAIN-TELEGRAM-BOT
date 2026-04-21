import { AlertTriangle } from 'lucide-react';
import type { AggregatedPetValue } from '../types/pet';

interface VarianceIndicatorProps {
  pet: AggregatedPetValue;
  showText?: boolean;
}

export function VarianceIndicator({ pet, showText = true }: VarianceIndicatorProps) {
  const { variancePercent, confidence } = pet;
  
  // Only show for medium variance or higher
  if (confidence === 'very-high' || confidence === 'high') {
    return null;
  }

  const getMessage = () => {
    if (confidence === 'medium') {
      return `${variancePercent.toFixed(0)}% variance across sources`;
    } else if (confidence === 'low') {
      return `High variance (${variancePercent.toFixed(0)}%) - verify values`;
    }
    return 'Limited data - only 1 source';
  };

  return (
    <div 
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm
        ${confidence === 'low' 
          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        }
      `}
      title="Sources disagree on this pet's value. Check individual values before trading."
    >
      <AlertTriangle size={14} />
      {showText && <span>{getMessage()}</span>}
    </div>
  );
}

interface SourceBreakdownModalProps {
  pet: AggregatedPetValue | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SourceBreakdownModal({ pet, isOpen, onClose }: SourceBreakdownModalProps) {
  if (!isOpen || !pet) return null;

  const sourceEntries = Object.entries(pet.sources).filter(([_, v]) => v !== undefined);
  const minValue = Math.min(...sourceEntries.map(([_, v]) => v as number));
  const maxValue = Math.max(...sourceEntries.map(([_, v]) => v as number));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-ton-card rounded-xl border border-white/10 max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{pet.name}</h3>
          <button 
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
            <span className="text-white/70">Consensus Value</span>
            <span className="text-xl font-bold text-white">{pet.consensus}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
            <span className="text-white/70">Variance</span>
            <span className={`font-medium ${pet.variancePercent > 25 ? 'text-orange-400' : 'text-yellow-400'}`}>
              ±{pet.variancePercent.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <h4 className="text-sm font-medium text-white/70 mb-3">Individual Sources</h4>
          <div className="space-y-2">
            {sourceEntries.map(([source, value]) => {
              const isMin = value === minValue;
              const isMax = value === maxValue;
              const isConsensus = value === pet.consensus;
              
              return (
                <div 
                  key={source}
                  className={`
                    flex justify-between items-center p-2 rounded-lg
                    ${isMin ? 'bg-orange-500/10 border border-orange-500/20' : ''}
                    ${isMax ? 'bg-green-500/10 border border-green-500/20' : ''}
                    ${isConsensus ? 'bg-ton-accent/10 border border-ton-accent/20' : 'bg-white/5'}
                  `}
                >
                  <span className="text-sm text-white/80 capitalize">
                    {source.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{value}</span>
                    {isMin && <span className="text-xs text-orange-400">Lowest</span>}
                    {isMax && <span className="text-xs text-green-400">Highest</span>}
                    {isConsensus && <span className="text-xs text-ton-accent">Match</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 bg-ton-accent text-ton-dark font-medium rounded-lg hover:bg-ton-accent/90 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
