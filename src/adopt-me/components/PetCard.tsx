import { useState } from 'react';
import { Plus, Sparkles, Star } from 'lucide-react';
import type { AggregatedPetValue } from '../types/pet';
import { SourceCountBadge } from './SourceCountBadge';
import { VarianceIndicator } from './VarianceIndicator';

interface PetCardProps {
  pet: AggregatedPetValue;
  onAddToInventory?: (pet: AggregatedPetValue, variant: 'normal' | 'neon' | 'mega') => void;
  onAddToWishlist?: (pet: AggregatedPetValue) => void;
  isNew?: boolean;
}

const RARITY_COLORS = {
  common: 'border-gray-400',
  uncommon: 'border-green-400',
  rare: 'border-blue-400',
  'ultra-rare': 'border-purple-400',
  legendary: 'border-yellow-400',
};

const RARITY_LABELS = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  'ultra-rare': 'Ultra-Rare',
  legendary: 'Legendary',
};

export function PetCard({ pet, onAddToInventory, onAddToWishlist, isNew }: PetCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<'normal' | 'neon' | 'mega'>('normal');

  const getCurrentValue = () => {
    switch (selectedVariant) {
      case 'neon':
        return pet.neonConsensus || pet.consensus * 3;
      case 'mega':
        return pet.megaConsensus || pet.consensus * 4.5;
      default:
        return pet.consensus;
    }
  };

  const value = getCurrentValue();

  return (
    <div 
      className={`
        relative bg-ton-card rounded-xl border-2 p-4 transition-all duration-200
        hover:scale-[1.02] hover:shadow-lg
        ${RARITY_COLORS[pet.category] || 'border-white/10'}
        ${isNew ? 'ring-2 ring-ton-accent ring-offset-2 ring-offset-ton-dark' : ''}
      `}
    >
      {/* New Badge */}
      {isNew && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ton-accent text-ton-dark text-xs font-bold px-3 py-1 rounded-full">
          NEW THIS WEEK
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-lg leading-tight">{pet.name}</h3>
          <span className="text-xs text-white/50">{RARITY_LABELS[pet.category]}</span>
        </div>
        <SourceCountBadge pet={pet} size="sm" />
      </div>

      {/* Value Display */}
      <div className="text-center py-3">
        <div className="text-3xl font-bold text-white">{value}</div>
        <div className="text-xs text-white/50">legendaries</div>
      </div>

      {/* Variance Warning */}
      {pet.confidence !== 'very-high' && pet.confidence !== 'high' && (
        <div className="mb-3">
          <VarianceIndicator pet={pet} />
        </div>
      )}

      {/* Variant Selector */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setSelectedVariant('normal')}
          className={`
            flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${selectedVariant === 'normal' 
              ? 'bg-ton-accent text-ton-dark' 
              : 'bg-white/5 text-white/70 hover:bg-white/10'
            }
          `}
        >
          Normal
        </button>
        <button
          onClick={() => setSelectedVariant('neon')}
          className={`
            flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1
            ${selectedVariant === 'neon' 
              ? 'bg-purple-500 text-white' 
              : 'bg-white/5 text-white/70 hover:bg-white/10'
            }
          `}
        >
          <Sparkles size={14} />
          Neon
        </button>
        <button
          onClick={() => setSelectedVariant('mega')}
          className={`
            flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1
            ${selectedVariant === 'mega' 
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
              : 'bg-white/5 text-white/70 hover:bg-white/10'
            }
          `}
        >
          <Star size={14} />
          Mega
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {onAddToInventory && (
          <button
            onClick={() => onAddToInventory(pet, selectedVariant)}
            className="flex-1 bg-ton-accent text-ton-dark py-2 rounded-lg font-medium text-sm hover:bg-ton-accent/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={16} />
            Add to Inventory
          </button>
        )}
        {onAddToWishlist && (
          <button
            onClick={() => onAddToWishlist(pet)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
            title="Add to Wishlist"
          >
            <Star size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
