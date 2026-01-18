// Spell effect metadata based on eoweb's get-effect-metadata.ts
// Maps spell graphic IDs to their animation properties

export interface SpellMetadata {
  frames: number;
  loops: number;
  hasBehindLayer: boolean;
  hasTransparentLayer: boolean;
  hasInFrontLayer: boolean;
  offsetX: number;
  offsetY: number;
}

// Default metadata for spells without specific configuration
const DEFAULT_METADATA: SpellMetadata = {
  frames: 4,
  loops: 2,
  hasBehindLayer: false,
  hasTransparentLayer: false,
  hasInFrontLayer: true,
  offsetX: 0,
  offsetY: 0,
};

// Metadata for common spell effects from eoweb
const SPELL_METADATA: Record<number, SpellMetadata> = {
  10: { // Heal
    frames: 5,
    loops: 1,
    hasBehindLayer: false,
    hasTransparentLayer: false,
    hasInFrontLayer: true,
    offsetX: 0,
    offsetY: 0,
  },
  14: { // Fire Ball
    frames: 6,
    loops: 1,
    hasBehindLayer: false,
    hasTransparentLayer: false,
    hasInFrontLayer: true,
    offsetX: 0,
    offsetY: 0,
  },
  15: { // Ice Ball
    frames: 6,
    loops: 1,
    hasBehindLayer: false,
    hasTransparentLayer: false,
    hasInFrontLayer: true,
    offsetX: 0,
    offsetY: 0,
  },
  16: { // Shock Ball
    frames: 6,
    loops: 1,
    hasBehindLayer: false,
    hasTransparentLayer: false,
    hasInFrontLayer: true,
    offsetX: 0,
    offsetY: 0,
  },
  17: { // Poison Ball
    frames: 6,
    loops: 1,
    hasBehindLayer: false,
    hasTransparentLayer: false,
    hasInFrontLayer: true,
    offsetX: 0,
    offsetY: 0,
  },
  18: { // Inferno
    frames: 9,
    loops: 1,
    hasBehindLayer: false,
    hasTransparentLayer: false,
    hasInFrontLayer: true,
    offsetX: 0,
    offsetY: 0,
  },
  19: { // Avalanche
    frames: 9,
    loops: 1,
    hasBehindLayer: false,
    hasTransparentLayer: false,
    hasInFrontLayer: true,
    offsetX: 0,
    offsetY: 0,
  },
  20: { // Thunder
    frames: 9,
    loops: 1,
    hasBehindLayer: false,
    hasTransparentLayer: false,
    hasInFrontLayer: true,
    offsetX: 0,
    offsetY: 0,
  },
  21: { // Toxin
    frames: 9,
    loops: 1,
    hasBehindLayer: false,
    hasTransparentLayer: false,
    hasInFrontLayer: true,
    offsetX: 0,
    offsetY: 0,
  },
  31: { // Magic Whirl
    frames: 15,
    loops: 1,
    hasBehindLayer: false,
    hasTransparentLayer: false,
    hasInFrontLayer: true,
    offsetX: 0,
    offsetY: 0,
  },
  // Add more as needed
};

export function getSpellMetadata(graphicId: number): SpellMetadata {
  return SPELL_METADATA[graphicId] || DEFAULT_METADATA;
}
