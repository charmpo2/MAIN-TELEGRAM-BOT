/**
 * Pet name normalization utilities for cross-source matching
 */

export function normalizePetName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/\b(neon|mega|fly|ride|nfr|mfr|fr|nr|mr|no-potion|np)\b/g, '')
    .replace(/-+/g, '-')
    .replace(/-$/g, '')
    .trim();
}

export function slugifyPetName(name: string): string {
  return normalizePetName(name);
}

// Common aliases for fuzzy matching
export const PET_ALIASES: Record<string, string[]> = {
  'shadow-dragon': ['shadow', 'shadowdragon'],
  'frost-dragon': ['frost', 'frostdragon'],
  'bat-dragon': ['batdragon', 'bat'],
  'giraffe': ['girrafe', 'girafe'],
  'parrot': ['parot'],
  'owl': ['snowy-owl', 'barn-owl'],
  'crow': ['evil-crow'],
  'evil-unicorn': ['eviluni', 'evil-uni'],
  'arctic-reindeer': ['arctic'],
  'queen-bee': ['queenbee', 'queenb'],
  'king-monkey': ['kingmonkey', 'king-m'],
  'albino-monkey': ['albinomonkey', 'albino-m'],
  'ninja-monkey': ['ninjamonkey', 'ninja-m'],
  'business-monkey': ['businessmonkey', 'biz-monkey'],
  'toy-monkey': ['toymonkey'],
  'monkey-king': ['monkeyking'],
  'snow-owl': ['snowowl'],
  't-rex': ['trex', 'tyrannosaurus'],
  'dodo': ['dodo-bird'],
  'stegosaurus': ['stego'],
  'triceratops': ['trice', 'tri'],
  ' Woolly-mammoth': ['mammoth'],
  'sabertooth': ['saber', 'sabre'],
  'glyptodon': ['glypo'],
  'tasmanian-tiger': ['taz', 'tasmanian'],
  'skele-rex': ['skelerex', 'skeleton-rex'],
  'snowman': ['snow-man'],
  'lunar-gold-tiger': ['gold-tiger', 'lunar-tiger'],
  'lunar-white-tiger': ['white-tiger'],
  'lunar-moon-bear': ['moon-bear'],
  'lunar-muscle-pup': ['muscle-pup'],
  'zodiac-minion-chick': ['zodiac-chick', 'minion-chick'],
  'chick': ['baby-chick'],
  'robin': ['christmas-robin'],
  'swan': ['christmas-swan'],
  'polar-bear': ['christmas-polar-bear'],
  'arctic-fox': ['christmas-arctic-fox'],
  'wolf': ['christmas-wolf', 'winter-wolf'],
  'reindeer': ['christmas-reindeer'],
  'elf-shrew': ['shrew', 'christmas-shrew'],
  'rat': ['christmas-rat', 'elf-rat'],
  'ginger-cat': ['ginger', 'christmas-ginger-cat'],
  'turkey': ['thanksgiving-turkey'],
  'chicken': ['farm-chicken', 'farm-egg-chicken'],
  'silky-chicken': ['silkie', 'silkie-chicken'],
  'cow': ['farm-cow', 'moo-cow'],
  'pig': ['farm-pig'],
  'sheep': ['farm-sheep'],
  'llama': ['farm-llama'],
  'horse': ['farm-horse'],
  'donkey': ['farm-donkey', 'jackass'],
  'goat': ['farm-goat'],
  'lamb': ['farm-lamb'],
  'mongoose': ['farm-mongoose'],
  'capybara': ['jungle-capybara'],
  'crocodile': ['jungle-crocodile', 'croc'],
  'flamingo': ['jungle-flamingo'],
  'lion': ['jungle-lion'],
  'panther': ['jungle-panther'],
  'platypus': ['jungle-platypus'],
  'rhino': ['jungle-rhino', 'rhinoceros'],
  'snake': ['jungle-snake'],
  'hyena': ['safari-hyena'],
  'wild-boar': ['safari-boar', 'boar'],
  'meerkat': ['safari-meerkat'],
  'elephant': ['safari-elephant'],
  'zebra': ['safari-zebra'],
  'hedgehog': ['sonic-hedgehog'],
  'ghost-dragon': ['halloween-dragon', 'ghostdragon'],
  'evil-chickatrice': ['chickatrice'],
  'evil-dachshund': ['dachshund', 'evil-weiner-dog'],
  'lava-dragon': ['lavadragon', 'chinese-dragon'],
  'lava-wolf': ['lavawolf'],
  'strawberry-shortcake-bat-dragon': ['ssbd', 'strawberry-bat-dragon', 'shortcake-bat'],
  'yule-log-dog': ['yule-dog', 'christmas-dog'],
  'winters-fawn': ['winter-fawn', 'fawn'],
  'diamond-griffin': ['diamond-g'],
  'diamond-dragon': ['diamond-d'],
  'diamond-unicorn': ['diamond-u'],
  'golden-dragon': ['gold-dragon'],
  'golden-griffin': ['gold-griffin'],
  'golden-unicorn': ['gold-unicorn'],
  'golden-rat': ['gold-rat'],
  'metal-ox': ['metalox', 'm-ox'],
  'diamond-ladybug': ['diamond-lb'],
  'golden-ladybug': ['golden-lb'],
  'garden-flamingo': ['flamingo-plush'],
};

// Reverse lookup for normalization
export function getCanonicalName(name: string): string {
  const normalized = normalizePetName(name);
  
  for (const [canonical, aliases] of Object.entries(PET_ALIASES)) {
    if (canonical === normalized || aliases.includes(normalized)) {
      return canonical;
    }
  }
  
  return normalized;
}

export function normalizeVariant(name: string): { baseName: string; isNeon: boolean; isMega: boolean } {
  const lower = name.toLowerCase();
  const isMega = lower.includes('mega') || lower.includes('mfr') || lower.includes('mr');
  const isNeon = !isMega && (lower.includes('neon') || lower.includes('nfr') || lower.includes('nr'));
  
  let baseName = name
    .replace(/mega\s*/gi, '')
    .replace(/neon\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return { baseName: normalizePetName(baseName), isNeon, isMega };
}

// Calculate value multipliers
export const VALUE_MULTIPLIERS = {
  neon: 3,    // 4 pets combined, slight discount for effort
  mega: 4.5,  // 4 neons combined
};
