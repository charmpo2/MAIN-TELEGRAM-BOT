export type PetCategory = 'common' | 'uncommon' | 'rare' | 'ultra-rare' | 'legendary';
export type PetType = 'pet' | 'vehicle' | 'toy' | 'pet-wear' | 'stroller' | 'food' | 'gift' | 'house' | 'sticker';
export type ConfidenceLevel = 'very-high' | 'high' | 'medium' | 'low' | 'single';

export interface PetValue {
  id: string;
  name: string;
  category: PetCategory;
  type: PetType;
  value: number;
  neonValue?: number;
  megaValue?: number;
  imageUrl?: string;
  isNeon?: boolean;
  isMega?: boolean;
  rarity: PetCategory;
  demand?: 'low' | 'medium' | 'high' | 'very-high';
  lastUpdated: Date;
}

export interface AggregatedPetValue {
  id: string;
  name: string;
  category: PetCategory;
  type: PetType;
  consensus: number;
  neonConsensus?: number;
  megaConsensus?: number;
  sources: {
    amvgg?: number;
    elvebredd?: number;
    tradingValues?: number;
    adoptmevaluesApp?: number;
    driffle?: number;
    eldorado?: number;
  };
  sourceCount: number;
  variance: number;
  variancePercent: number;
  confidence: ConfidenceLevel;
  imageUrl?: string;
  lastUpdated: Date;
}

export interface InventoryPet {
  petId: string;
  name: string;
  quantity: number;
  isNeon: boolean;
  isMega: boolean;
  acquiredValue?: number;
  acquiredDate?: string;
  currentValue?: number;
}

export interface UserInventory {
  pets: InventoryPet[];
  savedAt: string;
  totalValue: number;
}

export interface TradeSide {
  pets: InventoryPet[];
  totalValue: number;
}

export interface TradeRecord {
  id: string;
  date: string;
  youGive: TradeSide;
  youGet: TradeSide;
  fairness: 'win' | 'fair' | 'lose';
  valueDifference: number;
  percentDifference: number;
}

export interface WishlistItem {
  petId: string;
  name: string;
  targetValue?: number;
  addedAt: string;
}

export interface NewPetDetection {
  id: string;
  name: string;
  category: PetCategory;
  detectedAt: string;
  confidence: ConfidenceLevel;
}

export interface AggregatedData {
  meta: {
    lastUpdated: string;
    sourceCount: number;
    totalPets: number;
    petsWithConsensus: number;
    petsSingleSource: number;
  };
  pets: AggregatedPetValue[];
  newPets: NewPetDetection[];
}

export const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  'very-high': 'bg-green-500',
  'high': 'bg-green-400',
  'medium': 'bg-yellow-400',
  'low': 'bg-orange-400',
  'single': 'bg-gray-400',
};

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  'very-high': 'Very High',
  'high': 'High',
  'medium': 'Medium',
  'low': 'Low',
  'single': 'Single Source',
};
