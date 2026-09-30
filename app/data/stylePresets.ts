/** Presets de couleur et de typo pour personnaliser les démos. */

export type ThemePreset = {
  id: string;
  label: string;
  ink: string;
  paper: string;
  muted: string;
  accent: string;
  accentSoft: string;
  surface: string;
};

export type FontPreset = {
  id: string;
  label: string;
  hint: string;
  display: string;
  body: string;
};

export const themePresets: ThemePreset[] = [
  {
    id: "sage",
    label: "Sauge",
    ink: "#24302c",
    paper: "#f7f5f1",
    muted: "#5f6f69",
    accent: "#5f8f82",
    accentSoft: "#dceae5",
    surface: "#eeebe6",
  },
  {
    id: "mint",
    label: "Menthe",
    ink: "#1f3330",
    paper: "#f5f8f6",
    muted: "#5a706b",
    accent: "#3d9b8a",
    accentSoft: "#d4efe9",
    surface: "#e8f0ed",
  },
  {
    id: "sky",
    label: "Ciel",
    ink: "#1e2a38",
    paper: "#f5f7fa",
    muted: "#5b6a7a",
    accent: "#4a7fb5",
    accentSoft: "#d7e6f4",
    surface: "#e8eef5",
  },
  {
    id: "navy",
    label: "Marine",
    ink: "#1a2436",
    paper: "#f4f6f9",
    muted: "#5a6578",
    accent: "#3f5f8f",
    accentSoft: "#d6deec",
    surface: "#e6ebf3",
  },
  {
    id: "indigo",
    label: "Indigo",
    ink: "#222038",
    paper: "#f6f5fa",
    muted: "#64607a",
    accent: "#5b5fad",
    accentSoft: "#dddff3",
    surface: "#ebeaf3",
  },
  {
    id: "lavender",
    label: "Lavande",
    ink: "#2a2436",
    paper: "#f7f5f9",
    muted: "#6a6278",
    accent: "#7a6aad",
    accentSoft: "#e5dff3",
    surface: "#eeeaf4",
  },
  {
    id: "plum",
    label: "Prune",
    ink: "#2c2230",
    paper: "#f8f5f7",
    muted: "#6d5f6e",
    accent: "#8a5a7a",
    accentSoft: "#eddfe8",
    surface: "#efe8ed",
  },
  {
    id: "rose",
    label: "Rose",
    ink: "#322428",
    paper: "#f9f5f5",
    muted: "#726065",
    accent: "#b06a7a",
    accentSoft: "#f0dde2",
    surface: "#f1e8ea",
  },
  {
    id: "coral",
    label: "Corail",
    ink: "#322622",
    paper: "#f9f6f3",
    muted: "#72635c",
    accent: "#c07858",
    accentSoft: "#f2e2d8",
    surface: "#f1ebe6",
  },
  {
    id: "terre",
    label: "Terre",
    ink: "#2f2620",
    paper: "#f8f5f0",
    muted: "#6e6258",
    accent: "#a67c5d",
    accentSoft: "#eddfd3",
    surface: "#efe8e0",
  },
  {
    id: "sand",
    label: "Sable",
    ink: "#2c261f",
    paper: "#f8f5ee",
    muted: "#6e6558",
    accent: "#9a8060",
    accentSoft: "#ebe1d2",
    surface: "#efe9df",
  },
  {
    id: "gold",
    label: "Doré",
    ink: "#2c271c",
    paper: "#f8f6ef",
    muted: "#6d6654",
    accent: "#b08940",
    accentSoft: "#f0e5cc",
    surface: "#efebe0",
  },
  {
    id: "olive",
    label: "Olive",
    ink: "#27291e",
    paper: "#f6f5ef",
    muted: "#656955",
    accent: "#7a8a4a",
    accentSoft: "#e4e8d4",
    surface: "#eceadf",
  },
  {
    id: "forest",
    label: "Forêt",
    ink: "#223028",
    paper: "#f5f7f4",
    muted: "#5a6b60",
    accent: "#4f8a64",
    accentSoft: "#d8eadf",
    surface: "#e7eee9",
  },
  {
    id: "slate",
    label: "Ardoise",
    ink: "#222830",
    paper: "#f5f6f8",
    muted: "#5c6570",
    accent: "#6a7685",
    accentSoft: "#dde2e8",
    surface: "#e9ecef",
  },
];

export const fontPresets: FontPreset[] = [
  {
    id: "classic",
    label: "Classique",
    hint: "Élégant et traditionnel",
    display: '"Fraunces", Georgia, serif',
    body: '"Manrope", system-ui, sans-serif',
  },
  {
    id: "modern",
    label: "Moderne",
    hint: "Net et contemporain",
    display: '"Archivo", system-ui, sans-serif',
    body: '"Work Sans", system-ui, sans-serif',
  },
  {
    id: "editorial",
    label: "Éditorial",
    hint: "Lecture soignée",
    display: '"Spectral", Georgia, serif',
    body: '"Work Sans", system-ui, sans-serif',
  },
  {
    id: "craft",
    label: "Artisanal",
    hint: "Chaleureux et authentique",
    display: '"Bitter", Georgia, serif',
    body: '"Hanken Grotesk", system-ui, sans-serif',
  },
];

export function getThemePreset(id: string | undefined): ThemePreset | null {
  if (!id) return null;
  return themePresets.find((t) => t.id === id) ?? null;
}

export function getFontPreset(id: string | undefined): FontPreset | null {
  if (!id) return null;
  return fontPresets.find((f) => f.id === id) ?? null;
}
