// =============================================================================
// src/ui/testModal.js — Modal de Validação Teórica e Benchmarks Analíticos
// Estrutural Lab 3D
// =============================================================================

import { StructuralModel } from '../model/structuralModel.js';
import { analyzeStructure } from '../analysis/analysisManager.js';
import { formatNumber, mToMm } from '../utils/units.js';

export function setupTestModal() {
  const modal = document.getElementById('modal-tests');
  const closeBtn = document.getElementById('btn-close-tests');
  const btnRunAll = document.getElementById('btn-run-all-benchmarks');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('show'));
  }

  if (btnRunAll) {
    btnRunAll.addEventListener('click', () => {
      runValidationBenchmarks();
    });
  }

  // Executa uma vez para preencher a tabela ao abrir
  if (modal) {
    runValidationBenchmarks();
  }
}

export function runValidationBenchmarks() {
  const tbody = document.getElementById('tbody-benchmarks');
  if (!tbody) return;

  tbody.innerHTML = '';

  const results = [];

  // ===========================================================================
  // Teste 1: Viga Biapoiada com Carga Pontual Central
  // L = 8m, P = 100kN, C25 (E = 25e6 kN/m²), Seção 20x40 (Iz = 0.001066667 m⁴)
  // ===========================================================================
  {
    const L = 8.0;
    const P = 100.0;
    const model = StructuralModel.createSimplySupportedBeam(L, P);
    const res = analyzeStructure(model);

    const E = 25e6;
    const Iz = (0.2 * Math.pow(0.4, 3)) / 12;
    const exactDisp = (P * Math.pow(L, 3)) / (48 * E * Iz); // metros
    const exactMoment = (P * L) / 4; // 200 kNm
    const exactReaction = P / 2; // 50 kN

    const femDisp = Math.abs(res.displacements.get('n1')?.uy || 0);
    const femReaction = Math.abs(res.reactions.get('n0')?.fy || 0);
    const ef = res.elementForces.get('e0');
    const femMoment = ef ? Math.max(...ef.Mz.map(Math.abs)) : 0;

    results.push({
      benchmark: 'Viga Biapoiada — Deslocamento Central',
      formula: 'δ = P·L³ / (48·E·I)',
      analytical: `${formatNumber(mToMm(exactDisp), 3)} mm`,
      fem: `${formatNumber(mToMm(femDisp), 3)} mm`,
      error: Math.abs(femDisp - exactDisp) / exactDisp * 100
    });

    results.push({
      benchmark: 'Viga Biapoiada — Momento Fletor Máximo',
      formula: 'M = P·L / 4',
      analytical: `${formatNumber(exactMoment, 1)} kNm`,
      fem: `${formatNumber(femMoment, 1)} kNm`,
      error: Math.abs(femMoment - exactMoment) / exactMoment * 100
    });

    results.push({
      benchmark: 'Viga Biapoiada — Reação de Apoio Vertical',
      formula: 'R = P / 2',
      analytical: `${formatNumber(exactReaction, 1)} kN`,
      fem: `${formatNumber(femReaction, 1)} kN`,
      error: Math.abs(femReaction - exactReaction) / exactReaction * 100
    });
  }

  // ===========================================================================
  // Teste 2: Viga em Balanço (Engaste e Extremidade Livre)
  // L = 4m, P = 50kN
  // ===========================================================================
  {
    const L = 4.0;
    const P = 50.0;
    const model = StructuralModel.createCantileverBeam(L, P);
    const res = analyzeStructure(model);

    const E = 25e6;
    const Iz = (0.2 * Math.pow(0.4, 3)) / 12;
    const exactDisp = (P * Math.pow(L, 3)) / (3 * E * Iz); // metros
    const exactMoment = P * L; // 200 kNm
    const exactReaction = P; // 50 kN

    const femDisp = Math.abs(res.displacements.get('n1')?.uy || 0);
    const r = res.reactions.get('n0');
    const femReaction = Math.abs(r?.fy || 0);
    const femMoment = Math.abs(r?.mz || 0);

    results.push({
      benchmark: 'Viga em Balanço — Flecha na Ponta',
      formula: 'δ = P·L³ / (3·E·I)',
      analytical: `${formatNumber(mToMm(exactDisp), 3)} mm`,
      fem: `${formatNumber(mToMm(femDisp), 3)} mm`,
      error: Math.abs(femDisp - exactDisp) / exactDisp * 100
    });

    results.push({
      benchmark: 'Viga em Balanço — Momento de Engaste',
      formula: 'M = P·L',
      analytical: `${formatNumber(exactMoment, 1)} kNm`,
      fem: `${formatNumber(femMoment, 1)} kNm`,
      error: Math.abs(femMoment - exactMoment) / exactMoment * 100
    });

    results.push({
      benchmark: 'Viga em Balanço — Reação Vertical',
      formula: 'R = P',
      analytical: `${formatNumber(exactReaction, 1)} kN`,
      fem: `${formatNumber(femReaction, 1)} kN`,
      error: Math.abs(femReaction - exactReaction) / exactReaction * 100
    });
  }

  // Renderiza linhas na tabela
  results.forEach(item => {
    const isPass = item.error < 0.5;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:600;">${item.benchmark}</td>
      <td style="font-family:var(--font-mono); font-size:10px; color:var(--text-muted);">${item.formula}</td>
      <td class="text-right">${item.analytical}</td>
      <td class="text-right" style="font-weight:700;">${item.fem}</td>
      <td class="text-right" style="color:${isPass ? '#34d399' : '#f87171'};">${formatNumber(item.error, 2)}%</td>
      <td class="text-right">
        <span class="brand-tag" style="background:${isPass ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color:${isPass ? '#34d399' : '#f87171'}; border-color:${isPass ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'};">
          ${isPass ? 'APROVADO' : 'REPROVADO'}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });

  return results;
}
