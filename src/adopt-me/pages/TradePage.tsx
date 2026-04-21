import { useState } from 'react';
import { Plus, Trash2, Scale, Check, X, ArrowRight } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { useAggregatedValues } from '../hooks/useAggregatedValues';
import type { AggregatedPetValue, InventoryPet } from '../types/pet';

interface TradeSide {
  pets: InventoryPet[];
  totalValue: number;
}

export function TradePage() {
  const { inventory } = useInventory();
  const { pets } = useAggregatedValues();
  const [youGive, setYouGive] = useState<TradeSide>({ pets: [], totalValue: 0 });
  const [youGet, setYouGet] = useState<TradeSide>({ pets: [], totalValue: 0 });
  const [showAddPanel, setShowAddPanel] = useState<'give' | 'get' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const addToSide = (side: 'give' | 'get', pet: AggregatedPetValue, variant: 'normal' | 'neon' | 'mega') => {
    const value = variant === 'mega' 
      ? (pet.megaConsensus || pet.consensus * 4.5)
      : variant === 'neon'
        ? (pet.neonConsensus || pet.consensus * 3)
        : pet.consensus;

    const newPet: InventoryPet = {
      petId: pet.id,
      name: pet.name,
      quantity: 1,
      isNeon: variant === 'neon',
      isMega: variant === 'mega',
      currentValue: value,
    };

    if (side === 'give') {
      setYouGive(prev => ({
        pets: [...prev.pets, newPet],
        totalValue: prev.totalValue + value,
      }));
    } else {
      setYouGet(prev => ({
        pets: [...prev.pets, newPet],
        totalValue: prev.totalValue + value,
      }));
    }

    setShowAddPanel(null);
  };

  const removeFromSide = (side: 'give' | 'get', index: number) => {
    if (side === 'give') {
      const pet = youGive.pets[index];
      setYouGive(prev => ({
        pets: prev.pets.filter((_, i) => i !== index),
        totalValue: prev.totalValue - ((pet.currentValue || 0) * pet.quantity),
      }));
    } else {
      const pet = youGet.pets[index];
      setYouGet(prev => ({
        pets: prev.pets.filter((_, i) => i !== index),
        totalValue: prev.totalValue - ((pet.currentValue || 0) * pet.quantity),
      }));
    }
  };

  const calculateFairness = () => {
    const difference = youGet.totalValue - youGive.totalValue;
    const percentDiff = youGive.totalValue > 0 ? (difference / youGive.totalValue) * 100 : 0;
    
    if (Math.abs(percentDiff) <= 10) return { result: 'fair' as const, percentDiff, difference };
    if (difference > 0) return { result: 'win' as const, percentDiff, difference };
    return { result: 'lose' as const, percentDiff, difference };
  };

  const fairness = calculateFairness();

  const filteredPets = pets.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getVariantLabel = (pet: InventoryPet) => {
    if (pet.isMega) return 'Mega';
    if (pet.isNeon) return 'Neon';
    return 'Normal';
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white">Trade Calculator</h1>
        <p className="text-sm text-white/50">Compare trade values before accepting</p>
      </div>

      {/* Fairness Result */}
      {(youGive.pets.length > 0 || youGet.pets.length > 0) && (
        <div className={`
          mx-4 mt-4 p-4 rounded-xl border-2 text-center
          ${fairness.result === 'fair' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400' : ''}
          ${fairness.result === 'win' ? 'bg-green-500/10 border-green-500/50 text-green-400' : ''}
          ${fairness.result === 'lose' ? 'bg-red-500/10 border-red-500/50 text-red-400' : ''}
        `}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Scale size={20} />
            <span className="font-bold text-lg uppercase">{fairness.result}</span>
          </div>
          <p className="text-sm">
            {fairness.difference > 0 ? '+' : ''}{fairness.difference} ({fairness.percentDiff > 0 ? '+' : ''}{fairness.percentDiff.toFixed(1)}%)
          </p>
        </div>
      )}

      {/* Trade Sides */}
      <div className="p-4 grid md:grid-cols-2 gap-4">
        {/* You Give */}
        <div className="bg-ton-card rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 bg-red-500/10 border-b border-red-500/20">
            <h2 className="font-semibold text-white flex items-center gap-2">
              You Give
              {youGive.totalValue > 0 && (
                <span className="text-sm font-normal text-white/70">
                  ({youGive.totalValue.toLocaleString()})
                </span>
              )}
            </h2>
          </div>
          <div className="p-4">
            {youGive.pets.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">Add pets you are trading away</p>
            ) : (
              <div className="space-y-2 mb-4">
                {youGive.pets.map((pet, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-white">{pet.name}</p>
                      <p className="text-xs text-white/50">{getVariantLabel(pet)} • {(pet.currentValue || 0).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => removeFromSide('give', i)}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => { setShowAddPanel('give'); setSearchQuery(''); }}
              className="w-full py-2.5 bg-white/5 border border-dashed border-white/20 rounded-lg text-white/70 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Pet
            </button>
          </div>
        </div>

        {/* You Get */}
        <div className="bg-ton-card rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 bg-green-500/10 border-b border-green-500/20">
            <h2 className="font-semibold text-white flex items-center gap-2">
              You Get
              {youGet.totalValue > 0 && (
                <span className="text-sm font-normal text-white/70">
                  ({youGet.totalValue.toLocaleString()})
                </span>
              )}
            </h2>
          </div>
          <div className="p-4">
            {youGet.pets.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">Add pets you are receiving</p>
            ) : (
              <div className="space-y-2 mb-4">
                {youGet.pets.map((pet, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-white">{pet.name}</p>
                      <p className="text-xs text-white/50">{getVariantLabel(pet)} • {(pet.currentValue || 0).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => removeFromSide('get', i)}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => { setShowAddPanel('get'); setSearchQuery(''); }}
              className="w-full py-2.5 bg-white/5 border border-dashed border-white/20 rounded-lg text-white/70 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Pet
            </button>
          </div>
        </div>
      </div>

      {/* Add Pet Panel */}
      {showAddPanel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-ton-card w-full sm:w-[500px] sm:rounded-xl rounded-t-xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-white">
                Add to {showAddPanel === 'give' ? 'You Give' : 'You Get'}
              </h3>
              <button
                onClick={() => setShowAddPanel(null)}
                className="text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 border-b border-white/10">
              <input
                type="text"
                placeholder="Search pets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30"
              />
            </div>

            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {filteredPets.slice(0, 20).map(pet => (
                <div key={pet.id} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{pet.name}</span>
                    <span className="text-sm text-white/50">{pet.consensus}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addToSide(showAddPanel, pet, 'normal')}
                      className="flex-1 py-1.5 bg-white/5 rounded text-sm text-white/70 hover:bg-white/10"
                    >
                      Normal ({pet.consensus})
                    </button>
                    <button
                      onClick={() => addToSide(showAddPanel, pet, 'neon')}
                      className="flex-1 py-1.5 bg-purple-500/20 rounded text-sm text-purple-400 hover:bg-purple-500/30"
                    >
                      Neon ({pet.neonConsensus || pet.consensus * 3})
                    </button>
                    <button
                      onClick={() => addToSide(showAddPanel, pet, 'mega')}
                      className="flex-1 py-1.5 bg-pink-500/20 rounded text-sm text-pink-400 hover:bg-pink-500/30"
                    >
                      Mega ({pet.megaConsensus || pet.consensus * 4.5})
                    </button>
                  </div>
                </div>
              ))}
              {filteredPets.length === 0 && (
                <p className="text-center text-white/50 py-8">No pets found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset Button */}
      {(youGive.pets.length > 0 || youGet.pets.length > 0) && (
        <div className="px-4">
          <button
            onClick={() => { setYouGive({ pets: [], totalValue: 0 }); setYouGet({ pets: [], totalValue: 0 }); }}
            className="w-full py-3 text-white/50 hover:text-white/70 transition-colors"
          >
            Reset Trade
          </button>
        </div>
      )}
    </div>
  );
}
