# Estrutural Lab 3D — Análise Estrutural Interativa v2.0 MEF

Aplicação web interativa de engenharia estrutural para modelagem, visualização e análise de estruturas em 3D via Método dos Elementos Finitos (MEF / Direct Stiffness Method).

---

## 🔗 Acesso Online (GitHub Pages)

**Link:** `https://<seu-usuario>.github.io/<repositorio>/`

> ⚠️ **Importante:** Por usar ES Modules nativos, o projeto deve ser servido via HTTP. Não funciona ao abrir diretamente como `file://`. Use GitHub Pages ou um servidor local.

---

## ✨ Funcionalidades

### Modelagem Interativa
- Templates paramétricos: Viga Biapoiada, Viga em Balanço, Viga Contínua (3 vãos), Pórtico Simples, Pórtico Multivãos, Edifício Reticulado (N andares × M vãos)
- Criação manual de nós (X, Y, Z), elementos, apoios e cargas
- Modos de análise **2D Plano** e **3D Espacial**
- Salvar/carregar modelos em JSON

### Motor de Análise Estrutural Real
- **Método da Rigidez Direta** (Direct Stiffness Method)
- Elemento de pórtico 2D — 3 DOFs/nó: Ux, Uy, Rz
- Elemento de pórtico 3D — 6 DOFs/nó: Ux, Uy, Uz, Rx, Ry, Rz
- Montagem da rigidez global e particionamento por eliminação (K_ff, K_rf)
- Eliminação Gaussiana com pivoteamento parcial
- Cargas distribuídas uniformes e trapezoidais com forças nodais equivalentes corretas (Euler-Bernoulli)
- Verificação de instabilidade cinemática e singularidade de matriz

### Tipos de Cargas
- Forças e momentos concentrados nodais (Fx, Fy, Fz, Mx, My, Mz)
- Cargas distribuídas lineares/trapezoidais em direção local (x, y, z)
- Templates incluem peso próprio e sobrecargas de pavimento configuráveis

### Condições de Apoio
- Articulado (2º Gênero): restringe Ux + Uy
- Móvel (1º Gênero): restringe Uy
- Engaste (3º Gênero): restringe Ux + Uy + Rz (2D) ou todos os 6 DOFs (3D)
- Configuração manual por DOF individual

### Visualização 3D (Three.js)
- Barras cilíndricas com iluminação realista
- Símbolos 3D de apoios (cone articulado, cone + roletes móvel, bloco engaste)
- Vetores de forças e distribuição de cargas ("pente")
- **Forma deformada** com escala ajustável (1× a 1000×) e wireframe fantasma
- **Diagramas N, V, M** em 3D com hachuras, normalização dinâmica e etiquetas de pico
- Controles de câmera: órbita, pan, zoom, vista 2D frontal, perspectiva isométrica
- Controle de camadas: nós, rótulos, apoios, cargas, grid

### Resultados
- Deslocamentos nodais em mm e mrad
- Reações de apoio em kN e kNm
- Esforços internos (N, V, M) discretizados em 21 pontos por elemento
- Verificação de equilíbrio estático global (resíduo ΣF_ext + ΣR)
- Benchmarks analíticos com comparação MEF vs. fórmulas fechadas

---

## 📐 Formulação Matemática

### Elemento 2D (Euler-Bernoulli)

DOFs: `[u₁, v₁, θ₁, u₂, v₂, θ₂]`

Matriz de rigidez local 6×6:
```
K_local =
  EA/L [axial]  +  EIz/L³ [flexão]
```

Transformação: `K_global = Tᵀ · K_local · T`

### Cargas Distribuídas — Forças Nodais Equivalentes

Para carga uniforme `q` em y local (Euler-Bernoulli):
- `F_y1 = qL/2`, `M_z1 = +qL²/12`
- `F_y2 = qL/2`, `M_z2 = -qL²/12`

Para carga trapezoidal `q0→q1`:
- `F_y1 = L(7q0 + 3q1)/20`, `M_z1 = L²(3q0 + 2q1)/60`
- `F_y2 = L(3q0 + 7q1)/20`, `M_z2 = -L²(2q0 + 3q1)/60`

### Sistema de Unidades
| Grandeza | Unidade |
|---|---|
| Comprimento | m |
| Força | kN |
| Momento | kN·m |
| Carga distribuída | kN/m |
| Módulo de elasticidade | kN/m² (E em MPa × 1000) |
| Seção transversal | m², m⁴ |

---

## 📁 Estrutura de Arquivos

```
estrutural-lab-3d/
├── index.html                  # Entrada principal (HTML semântico)
├── .nojekyll                   # Compatibilidade GitHub Pages
├── README.md
│
├── css/                        # Estilos modulares
│   ├── main.css                # Variáveis de tema, reset
│   ├── layout.css              # Layout 3 colunas
│   ├── panels.css              # Painéis, listas, tabelas
│   ├── forms.css               # Botões, inputs, sliders
│   └── visualization.css       # Overlays, modais, toasts
│
├── src/                        # Código ES Modules
│   ├── main.js                 # Bootstrap da aplicação
│   ├── core/                   # Orquestração (app, state, events, config)
│   ├── model/                  # Modelo físico (nodes, elements, materials, sections, supports)
│   ├── loads/                  # Carregamentos (pontuais, distribuídos, equivalentes)
│   ├── analysis/               # Motor FEM (montagem, solver, reações, esforços)
│   ├── visualization/          # Three.js (renderer, câmera, nós, barras, apoios, cargas, diagramas)
│   ├── ui/                     # Controladores de interface (painéis, toolbar, resultados)
│   ├── results/                # Gestão de resultados e escala de diagramas
│   ├── persistence/            # Salvar/carregar JSON
│   └── utils/                  # Matemática, erros, validação, unidades
│
└── tests/
    ├── index.html              # Dashboard de testes no navegador
    ├── runTests.js             # Executor central
    ├── beam.test.js            # Vigas (biapoiada, balanço, distribuída)
    ├── frame2D.test.js         # Pórticos planos
    ├── frame3D.test.js         # Pórticos espaciais
    ├── loads.test.js           # Cargas equivalentes
    └── modelSerialization.test.js # Serialização JSON
```

---

## 🚀 Publicação no GitHub Pages

### 1. Criar repositório

1. Acesse [github.com](https://github.com) → **New repository**
2. Nome (ex: `estrutural-lab-3d`), **Public**, sem README
3. **Create repository**

### 2. Enviar arquivos

**Via terminal (Git):**
```bash
git init
git add .
git commit -m "Estrutural Lab 3D v2.0 MEF"
git branch -M main
git remote add origin https://github.com/<seu-usuario>/estrutural-lab-3d.git
git push -u origin main
```

**Via upload no GitHub:** Arraste toda a pasta para a interface web.

### 3. Ativar GitHub Pages

**Settings → Pages → Source: Deploy from a branch → main / (root) → Save**

Após ~2 minutos: `https://<seu-usuario>.github.io/estrutural-lab-3d/`

---

## 💻 Execução Local

```bash
# Python (recomendado)
python -m http.server 8000

# Acesse no navegador:
http://localhost:8000/

# Testes analíticos:
http://localhost:8000/tests/
```

> ⚠️ **Não** abra o `index.html` diretamente como arquivo (protocolo `file://`). ES Modules requerem HTTP.

---

## 🧪 Testes de Validação (25 casos, 100% aprovados)

| Caso | Grandeza | Fórmula Analítica | Tolerância |
|---|---|---|---|
| Viga biapoiada (P central) | Flecha δ_max | `PL³/(48EI)` | < 0.01% |
| Viga biapoiada (P central) | Momento M_max | `PL/4` | < 0.01% |
| Viga biapoiada (q uniforme) | Reação R_y | `qL/2` | < 0.01% |
| Viga em balanço | Flecha δ_ponta | `PL³/(3EI)` | < 0.01% |
| Viga em balanço | Momento M_engaste | `PL` | < 0.01% |
| Pórtico 2D | Equilíbrio global | `ΣF = 0` | < 1e-8 kN |
| Carga uniforme | Forças equivalentes | `qL/2, qL²/12` | < 0.01% |
| Carga trapezoidal | Forças equivalentes | Fórmulas RDM | < 0.01% |
| Serialização JSON | Ida e volta | Todos os campos | exato |

---

## ⚠️ Limitações Conhecidas

1. **Análise linear de 1ª ordem** — efeitos P-Δ (2ª ordem) não incluídos
2. **Sem diafragma rígido de pavimento** — hipótese não ativada por padrão
3. **Elementos de barra** apenas — sem lajes, paredes ou casca
4. **Seções retangulares** com propriedades automáticas; outras seções por entrada manual

---

## 🛠️ Tecnologias

| Biblioteca | Versão | Uso |
|---|---|---|
| Three.js | 0.160.0 | Renderização 3D WebGL |
| three/addons | 0.160.0 | OrbitControls |
| CSS puro | — | Layout e tema |
| JavaScript (ES2022) | — | Motor FEM + UI |

Sem bundlers, sem frameworks UI, sem compilação — funciona diretamente no navegador.
