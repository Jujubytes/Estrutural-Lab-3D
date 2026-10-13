// =============================================================================
// src/core/config.js — Constantes e Configurações Globais da Aplicação
// Estrutural Lab 3D
// =============================================================================

export const CONFIG = {
  APP_NAME: 'Estrutural Lab 3D',
  VERSION: '2.0.0',

  // Cores do Tema Estrutural
  COLORS: {
    NODE_DEFAULT: 0x64748b,       // slate-500
    NODE_SUPPORTED: 0x10b981,     // emerald-500
    NODE_SELECTED: 0x38bdf8,      // sky-400
    ELEMENT_DEFAULT: 0x94a3b8,    // slate-400
    ELEMENT_SELECTED: 0x38bdf8,   // sky-400
    GHOST_LINE: 0x475569,         // slate-600
    LOAD_POINT: 0xef4444,         // red-500
    LOAD_DISTRIBUTED: 0xf97316,   // orange-500
    DIAGRAM_N: 0x38bdf8,          // sky-400 (Azul)
    DIAGRAM_V: 0x34d399,          // emerald-400 (Verde)
    DIAGRAM_M: 0xfbbf24           // amber-400 (Amarelo)
  },

  // Escalas e Dimensões 3D
  VIEWPORT: {
    NODE_RADIUS: 0.12,
    ELEMENT_RADIUS: 0.06,
    DEFAULT_DEFORM_SCALE: 100,
    MAX_DEFORM_SCALE: 1000
  }
};
