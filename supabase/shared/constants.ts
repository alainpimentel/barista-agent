export const VALID_BREW_METHODS = [
  "v60",
  "espresso",
  "aeropress",
  "french_press",
  "chemex",
  "kalita",
  "coldbrew",
] as const;

export type BrewMethod = typeof VALID_BREW_METHODS[number];