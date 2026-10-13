// =============================================================================
// src/ui/toolbar.js — Barra de Ferramentas Superior e Ações de Projeto
// Estrutural Lab 3D
// =============================================================================

import { appState } from '../core/state.js';
import { analyzeStructure } from '../analysis/analysisManager.js';
import { saveModelToFile } from '../persistence/saveModel.js';
import { loadModelFromFile } from '../persistence/loadModel.js';
import { showToast } from './notifications.js';
import { StructuralModel } from '../model/structuralModel.js';

export function setupToolbar() {
  // 1. Seletor de Dimensão 2D / 3D
  const modeSelect = document.getElementById('select-dimension-mode');
  if (modeSelect) {
    modeSelect.value = appState.model.dimension;
    modeSelect.addEventListener('change', (e) => {
      appState.model.dimension = e.target.value;
      appState.notifyModelChanged();
      showToast(`Modo alterado para ${e.target.value}.`, 'info');
    });
  }

  // 2. Novo Modelo
  const btnNew = document.getElementById('btn-new-model');
  const modalNew = document.getElementById('modal-new-confirm');
  const btnConfirmNew = document.getElementById('btn-confirm-new');
  const btnCancelNew = document.getElementById('btn-cancel-new');

  if (btnNew && modalNew) {
    btnNew.addEventListener('click', () => {
      modalNew.classList.add('show');
    });
    if (btnConfirmNew) {
      btnConfirmNew.addEventListener('click', () => {
        const newModel = new StructuralModel(appState.model.dimension);
        appState.setModel(newModel);
        modalNew.classList.remove('show');
        showToast('Novo modelo vazio iniciado.', 'info');
      });
    }
    if (btnCancelNew) {
      btnCancelNew.addEventListener('click', () => {
        modalNew.classList.remove('show');
      });
    }
  }

  // 3. Abrir Arquivo JSON
  const btnOpen = document.getElementById('btn-open-model');
  const fileInput = document.getElementById('input-file-model');

  if (btnOpen && fileInput) {
    btnOpen.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const loadedModel = await loadModelFromFile(file);
        appState.setModel(loadedModel);
        showToast(`Modelo "${file.name}" carregado com sucesso!`, 'success');
        if (modeSelect) modeSelect.value = loadedModel.dimension;
      } catch (err) {
        showToast(`Erro ao abrir modelo: ${err.message}`, 'error');
      } finally {
        fileInput.value = '';
      }
    });
  }

  // 4. Salvar Arquivo JSON
  const btnSave = document.getElementById('btn-save-model');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      try {
        saveModelToFile(appState.model, 'modelo_estrutural.json');
        showToast('Modelo exportado em formato JSON.', 'success');
      } catch (err) {
        showToast(`Erro ao salvar modelo: ${err.message}`, 'error');
      }
    });
  }

  // 5. Limpar Resultados
  const btnClear = document.getElementById('btn-clear-results');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      appState.clearAnalysisResult();
      showToast('Resultados de análise limpos.', 'info');
    });
  }

  // 6. Botão de Testes Analíticos de Validação
  const btnTests = document.getElementById('btn-run-tests');
  const modalTests = document.getElementById('modal-tests');
  if (btnTests && modalTests) {
    btnTests.addEventListener('click', () => {
      modalTests.classList.add('show');
    });
  }

  // 7. Botão Analisar Estrutura (MEF)
  const btnAnalyze = document.getElementById('btn-analyze-model');
  if (btnAnalyze) {
    btnAnalyze.addEventListener('click', () => {
      showToast('Processando análise estática linear MEF...', 'info', 1500);

      setTimeout(() => {
        const result = analyzeStructure(appState.model);
        if (result.success) {
          appState.setAnalysisResult(result);
          showToast('Análise MEF concluída com sucesso!', 'success');
        } else {
          appState.clearAnalysisResult();
          showToast(`Falha na análise: ${result.error}`, 'error', 6000);
        }
      }, 50);
    });
  }
}
