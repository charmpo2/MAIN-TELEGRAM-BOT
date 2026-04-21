import { useState, useMemo } from 'react';
import { Search, RefreshCw, Sparkles } from 'lucide-react';
import { useAggregatedValues } from '../hooks/useAggregatedValues';
import { useInventory } from '../hooks/useInventory';
import { PetCard } from '../components/PetCard';
import type { AggregatedPetValue, PetCategory } from '../types/pet';

const CATEGORIES: PetCategory[] = ['legendary', 'ultra-rare', 'rare', 'uncommon', 'common'];

export function ValuesPage() {
  const { pets, newPets, loading, error, refetch, lastUpdated } = useAggregatedValues();
  const { addPet } = useInventory();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PetCategory | 'all'>('all');
  const [showNewOnly, setShowNewOnly] = useState(false);

  const filteredPets = useMemo(() => {
    let result = pets;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Filter to new pets only
    if (showNewOnly) {
      const newPetIds = new Set(newPets.map(p => p.id));
      result = result.filter(p => newPetIds.has(p.id));
    }

    return result;
  }, [pets, searchQuery, selectedCategory, showNewOnly, newPets]);

  const handleAddToInventory = (pet: AggregatedPetValue, variant: 'normal' | 'neon' | 'mega') => {
    addPet(pet, variant);
    // Could show toast here
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ton-accent mx-auto mb-4" />
          <p className="text-white/70">Loading pet values from 6 sources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={refetch}
            className="bg-ton-accent text-ton-dark px-4 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-ton-dark/95 backdrop-blur-sm z-40 border-b border-white/10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Adopt Me Values</h1>
              <p className="text-sm text-white/50">
                {lastUpdated ? `Updated ${lastUpdated.toLocaleDateString()}` : 'Loading...'}
              </p>
            </div>
            <button
              onClick={refetch}
              className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={20} className="text-white/70" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <input
              type="text"
              placeholder="Search pets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-ton-accent/50"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${selectedCategory === 'all' 
                  ? 'bg-ton-accent text-ton-dark' 
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
                }
              `}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors capitalize
                  ${selectedCategory === cat 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }
                `}
              >
                {cat.replace('-', '-')}
              </button>
            ))}
            {newPets.length > 0 && (
              <button
                onClick={() => setShowNewOnly(!showNewOnly)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  flex items-center gap-1
                  ${showNewOnly 
                    ? 'bg-ton-accent text-ton-dark' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }
                `}
              >
                <Sparkles size={14} />
                New ({newPets.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50">
            Showing {filteredPets.length} of {pets.length} pets
          </span>
          <span className="text-white/50">
            Averaged from 6 sources
          </span>
        </div>
      </div>

      {/* Pet Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPets.map(pet => (
          <PetCard
            key={pet.id}
            pet={pet}
            onAddToInventory={handleAddToInventory}
            isNew={newPets.some(np => np.id === pet.id)}
          />
        ))}
      </div>

      {filteredPets.length === 0 && (
        <div className="text-center py-20">
          <p className="text-white/50 text-lg">No pets found matching your search</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setShowNewOnly(false); }}
            className="mt-4 text-ton-accent hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
