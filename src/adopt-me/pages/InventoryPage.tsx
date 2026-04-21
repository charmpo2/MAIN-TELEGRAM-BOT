import { useState } from 'react';
import { Trash2, Download, Upload, Plus, Sparkles, Star, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { useAggregatedValues } from '../hooks/useAggregatedValues';
import type { AggregatedPetValue } from '../types/pet';

export function InventoryPage() {
  const { inventory, removePet, updateQuantity, updateAcquiredValue, clearInventory, importInventory, exportInventory, totalValue } = useInventory();
  const { pets } = useAggregatedValues();
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const getCurrentPetValue = (petId: string, isNeon: boolean, isMega: boolean): number => {
    const pet = pets.find(p => p.id === petId);
    if (!pet) return 0;
    if (isMega) return pet.megaConsensus || pet.consensus * 4.5;
    if (isNeon) return pet.neonConsensus || pet.consensus * 3;
    return pet.consensus;
  };

  const handleExport = () => {
    const data = exportInventory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adopt-me-inventory-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (importInventory(importText)) {
      setShowImport(false);
      setImportText('');
      alert('Inventory imported successfully!');
    } else {
      alert('Failed to import. Please check the JSON format.');
    }
  };

  const toggleExpanded = (key: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedItems(newSet);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">My Inventory</h1>
            <p className="text-sm text-white/50">
              {inventory.pets.length} items • Total value: <span className="text-ton-accent font-semibold">{totalValue.toLocaleString()}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              title="Export inventory"
            >
              <Download size={20} className="text-white/70" />
            </button>
            <button
              onClick={() => setShowImport(!showImport)}
              className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              title="Import inventory"
            >
              <Upload size={20} className="text-white/70" />
            </button>
          </div>
        </div>

        {/* Import Panel */}
        {showImport && (
          <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-white/70 mb-2">Paste inventory JSON:</p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white mb-2"
              placeholder={`{"pets": [{"petId": "shadow-dragon", ...}]}`}
            />
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className="flex-1 bg-ton-accent text-ton-dark py-2 rounded-lg font-medium text-sm"
              >
                Import
              </button>
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 bg-white/5 text-white/70 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inventory List */}
      {inventory.pets.length === 0 ? (
        <div className="text-center py-20 px-4">
          <p className="text-white/50 mb-4">Your inventory is empty</p>
          <p className="text-sm text-white/30">
            Go to the Values page to add pets to your inventory
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {inventory.pets.map((pet, index) => {
            const currentValue = getCurrentPetValue(pet.petId, pet.isNeon, pet.isMega);
            const profit = pet.acquiredValue ? currentValue - pet.acquiredValue : null;
            const itemKey = `${pet.petId}-${pet.isNeon}-${pet.isMega}`;
            const isExpanded = expandedItems.has(itemKey);

            return (
              <div 
                key={itemKey}
                className="bg-ton-card rounded-xl border border-white/10 overflow-hidden"
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {pet.isMega && <Star size={14} className="text-pink-400" />}
                      {pet.isNeon && <Sparkles size={14} className="text-purple-400" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{pet.name}</h3>
                      <p className="text-xs text-white/50">
                        {pet.isMega ? 'Mega Neon' : pet.isNeon ? 'Neon' : 'Normal'} • x{pet.quantity}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-white">{(currentValue * pet.quantity).toLocaleString()}</p>
                      {profit !== null && (
                        <p className={`text-xs ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {profit >= 0 ? '+' : ''}{profit} each
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleExpanded(itemKey)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={18} className="text-white/50" /> : <ChevronDown size={18} className="text-white/50" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Quantity</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(pet.petId, pet.isNeon ? 'neon' : pet.isMega ? 'mega' : 'normal', pet.quantity - 1)}
                          className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10"
                        >
                          <Minus size={16} className="text-white/70" />
                        </button>
                        <span className="w-8 text-center font-medium text-white">{pet.quantity}</span>
                        <button
                          onClick={() => updateQuantity(pet.petId, pet.isNeon ? 'neon' : pet.isMega ? 'mega' : 'normal', pet.quantity + 1)}
                          className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10"
                        >
                          <Plus size={16} className="text-white/70" />
                        </button>
                      </div>
                    </div>

                    {/* Acquired Value */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Acquired Value (optional)</span>
                      <input
                        type="number"
                        value={pet.acquiredValue || ''}
                        onChange={(e) => updateAcquiredValue(pet.petId, pet.isNeon ? 'neon' : pet.isMega ? 'mega' : 'normal', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white text-right"
                      />
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removePet(pet.petId, pet.isNeon ? 'neon' : pet.isMega ? 'mega' : 'normal')}
                      className="w-full py-2 bg-red-500/20 text-red-400 rounded-lg font-medium text-sm hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Remove from Inventory
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Clear All */}
          <button
            onClick={clearInventory}
            className="w-full py-3 text-red-400 font-medium text-sm hover:text-red-300 transition-colors"
          >
            Clear All Inventory
          </button>
        </div>
      )}
    </div>
  );
}
