import { useState, useEffect, useCallback } from 'react';
import type { UserInventory, InventoryPet, AggregatedPetValue } from '../types/pet';

const STORAGE_KEY = 'adoptMeInventory';

interface UseInventoryReturn {
  inventory: UserInventory;
  addPet: (pet: AggregatedPetValue, variant: 'normal' | 'neon' | 'mega', quantity?: number) => void;
  removePet: (petId: string, variant: 'normal' | 'neon' | 'mega') => void;
  updateQuantity: (petId: string, variant: 'normal' | 'neon' | 'mega', quantity: number) => void;
  updateAcquiredValue: (petId: string, variant: 'normal' | 'neon' | 'mega', value: number) => void;
  clearInventory: () => void;
  importInventory: (json: string) => boolean;
  exportInventory: () => string;
  totalValue: number;
}

function getVariantValue(pet: AggregatedPetValue, variant: 'normal' | 'neon' | 'mega'): number {
  switch (variant) {
    case 'neon':
      return pet.neonConsensus || pet.consensus * 3;
    case 'mega':
      return pet.megaConsensus || pet.consensus * 4.5;
    default:
      return pet.consensus;
  }
}

function createEmptyInventory(): UserInventory {
  return {
    pets: [],
    savedAt: new Date().toISOString(),
    totalValue: 0,
  };
}

export function useInventory(): UseInventoryReturn {
  const [inventory, setInventory] = useState<UserInventory>(createEmptyInventory());

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setInventory(parsed);
      } catch (e) {
        console.error('Failed to parse inventory:', e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  }, [inventory]);

  const addPet = useCallback((
    pet: AggregatedPetValue,
    variant: 'normal' | 'neon' | 'mega' = 'normal',
    quantity: number = 1
  ) => {
    const existingIndex = inventory.pets.findIndex(
      p => p.petId === pet.id && p.isNeon === (variant === 'neon') && p.isMega === (variant === 'mega')
    );

    const currentValue = getVariantValue(pet, variant);

    if (existingIndex >= 0) {
      // Update existing
      const updated = [...inventory.pets];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity,
        currentValue,
      };
      setInventory(prev => ({
        ...prev,
        pets: updated,
        savedAt: new Date().toISOString(),
        totalValue: updated.reduce((sum, p) => sum + (p.currentValue || 0) * p.quantity, 0),
      }));
    } else {
      // Add new
      const newPet: InventoryPet = {
        petId: pet.id,
        name: pet.name,
        quantity,
        isNeon: variant === 'neon',
        isMega: variant === 'mega',
        acquiredDate: new Date().toISOString(),
        currentValue,
      };
      const updated = [...inventory.pets, newPet];
      setInventory(prev => ({
        ...prev,
        pets: updated,
        savedAt: new Date().toISOString(),
        totalValue: updated.reduce((sum, p) => sum + (p.currentValue || 0) * p.quantity, 0),
      }));
    }
  }, [inventory.pets]);

  const removePet = useCallback((petId: string, variant: 'normal' | 'neon' | 'mega') => {
    const updated = inventory.pets.filter(
      p => !(p.petId === petId && p.isNeon === (variant === 'neon') && p.isMega === (variant === 'mega'))
    );
    setInventory(prev => ({
      ...prev,
      pets: updated,
      savedAt: new Date().toISOString(),
      totalValue: updated.reduce((sum, p) => sum + (p.currentValue || 0) * p.quantity, 0),
    }));
  }, [inventory.pets]);

  const updateQuantity = useCallback((petId: string, variant: 'normal' | 'neon' | 'mega', quantity: number) => {
    if (quantity <= 0) {
      removePet(petId, variant);
      return;
    }

    const updated = inventory.pets.map(p => {
      if (p.petId === petId && p.isNeon === (variant === 'neon') && p.isMega === (variant === 'mega')) {
        return { ...p, quantity };
      }
      return p;
    });

    setInventory(prev => ({
      ...prev,
      pets: updated,
      savedAt: new Date().toISOString(),
      totalValue: updated.reduce((sum, p) => sum + (p.currentValue || 0) * p.quantity, 0),
    }));
  }, [inventory.pets, removePet]);

  const updateAcquiredValue = useCallback((petId: string, variant: 'normal' | 'neon' | 'mega', value: number) => {
    const updated = inventory.pets.map(p => {
      if (p.petId === petId && p.isNeon === (variant === 'neon') && p.isMega === (variant === 'mega')) {
        return { ...p, acquiredValue: value };
      }
      return p;
    });

    setInventory(prev => ({
      ...prev,
      pets: updated,
      savedAt: new Date().toISOString(),
    }));
  }, [inventory.pets]);

  const clearInventory = useCallback(() => {
    setInventory(createEmptyInventory());
  }, []);

  const importInventory = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.pets && Array.isArray(parsed.pets)) {
        setInventory({
          pets: parsed.pets,
          savedAt: new Date().toISOString(),
          totalValue: parsed.pets.reduce((sum: number, p: InventoryPet) => 
            sum + (p.currentValue || p.acquiredValue || 0) * p.quantity, 0
          ),
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import inventory:', e);
      return false;
    }
  }, []);

  const exportInventory = useCallback((): string => {
    return JSON.stringify(inventory, null, 2);
  }, [inventory]);

  return {
    inventory,
    addPet,
    removePet,
    updateQuantity,
    updateAcquiredValue,
    clearInventory,
    importInventory,
    exportInventory,
    totalValue: inventory.totalValue,
  };
}
