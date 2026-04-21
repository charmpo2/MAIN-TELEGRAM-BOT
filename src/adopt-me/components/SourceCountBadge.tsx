import { CONFIDENCE_COLORS, CONFIDENCE_LABELS } from '../types/pet';
import type { AggregatedPetValue } from '../types/pet';

interface SourceCountBadgeProps {
  pet: AggregatedPetValue;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function SourceCountBadge({ pet, showLabel = true, size = 'sm' }: SourceCountBadgeProps) {
  const { sourceCount, confidence, variancePercent } = pet;
  
  const colorClass = CONFIDENCE_COLORS[confidence];
  const label = CONFIDENCE_LABELS[confidence];
  
  // Generate tooltip text
  const getTooltip = () => {
    if (confidence === 'very-high') {
      return `Excellent consensus across ${sourceCount} sources (±${variancePercent.toFixed(1)}% variance)`;
    } else if (confidence === 'high') {
      return `Strong agreement from ${sourceCount} sources (±${variancePercent.toFixed(1)}% variance)`;
    } else if (confidence === 'medium') {
      return `Moderate agreement (${variancePercent.toFixed(1)}% variance between sources)`;
    } else if (confidence === 'low') {
      return `Significant disagreement (${variancePercent.toFixed(1)}% variance) - verify before trading`;
    } else {
      return `Only 1 source available - limited data`;
    }
  };

  return (
    <div 
      className="group relative inline-flex items-center"
      title={getTooltip()}
    >
      <span 
        className={`
          inline-flex items-center gap-1 rounded-full font-medium text-white
          ${SIZE_CLASSES[size]}
          ${colorClass}
        `}
      >
        <span className="font-bold">{sourceCount}</span>
        <span className="opacity-90">/6</span>
        {showLabel && (
          <span className="ml-1 opacity-90">{label}</span>
        )}
      </span>
      
      {/* Hover tooltip with details */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg border border-gray-700">
          <div className="font-medium mb-1">Value Sources:</div>
          <div className="space-y-0.5">
            {pet.sources.amvgg !== undefined && (
              <div className="flex justify-between gap-4">
                <span>AMVGG:</span>
                <span>{pet.sources.amvgg}</span>
              </div>
            )}
            {pet.sources.elvebredd !== undefined && (
              <div className="flex justify-between gap-4">
                <span>Elvebredd:</span>
                <span>{pet.sources.elvebredd}</span>
              </div>
            )}
            {pet.sources.tradingValues !== undefined && (
              <div className="flex justify-between gap-4">
                <span>TradingValues:</span>
                <span>{pet.sources.tradingValues}</span>
              </div>
            )}
            {pet.sources.adoptmevaluesApp !== undefined && (
              <div className="flex justify-between gap-4">
                <span>AdoptMeValues:</span>
                <span>{pet.sources.adoptmevaluesApp}</span>
              </div>
            )}
            {pet.sources.driffle !== undefined && (
              <div className="flex justify-between gap-4">
                <span>Driffle:</span>
                <span>{pet.sources.driffle}</span>
              </div>
            )}
            {pet.sources.eldorado !== undefined && (
              <div className="flex justify-between gap-4">
                <span>Eldorado:</span>
                <span>{pet.sources.eldorado}</span>
              </div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400">
            Consensus: <span className="text-white font-medium">{pet.consensus}</span>
            {variancePercent > 0 && (
              <span className="ml-2">(±{variancePercent.toFixed(1)}%)</span>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    </div>
  );
}
