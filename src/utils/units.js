// =============================================================================
// src/utils/units.js — Formatação de Valores e Conversões de Unidades
// Estrutural Lab 3D
// =============================================================================

/**
 * Formata números de engenharia de forma legível.
 * - Valores nulos ou indefinidos retornam '—'.
 * - Valores muito próximos de zero (< 1e-7) retornam '0.00'.
 * - Valores muito grandes (>= 1e4) ou muito pequenos (< 0.001) usam notação científica.
 */
export function formatNumber(val, decimals = 2) {
  if (val === undefined || val === null || isNaN(val)) return '—';
  const num = Number(val);
  if (Math.abs(num) < 1e-7) return '0.00';
  if (Math.abs(num) >= 10000 || Math.abs(num) < 0.001) {
    return num.toExponential(decimals);
  }
  return num.toFixed(decimals);
}

/**
 * Converte metros para milímetros.
 */
export function mToMm(m) {
  return m * 1000;
}

/**
 * Converte milímetros para metros.
 */
export function mmToM(mm) {
  return mm / 1000;
}

/**
 * Converte radianos para milirradianos.
 */
export function radToMrad(rad) {
  return rad * 1000;
}

/**
 * Converte kN para N.
 */
export function kNToN(kN) {
  return kN * 1000;
}

/**
 * Converte MPa para kN/m².
 * 1 MPa = 1 N/mm² = 1000 kN/m²
 */
export function mpaToKNm2(mpa) {
  return mpa * 1000;
}

/**
 * Converte kN/m² para GPa.
 * 1 GPa = 1e6 kN/m²
 */
export function knm2ToGPa(knm2) {
  return knm2 / 1e6;
}

/**
 * Faz parse seguro de valor numérico vindo de inputs.
 */
export function parseNumber(val, fallback = 0) {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
}
