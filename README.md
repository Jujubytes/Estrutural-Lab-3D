# Estrutural Lab 3D

Laboratório virtual interativo 3D para estudantes de Engenharia Civil.

## 🔗 Acesso Online

Este projeto está publicado no GitHub Pages e pode ser acessado diretamente pelo navegador, sem precisar instalar nenhum programa.

**Link:** `https://<seu-usuario>.github.io/<nome-do-repositorio>/`

---

## 📋 Funcionalidades

- **Modelos 3D interativos** — Viga Biapoiada, Viga em Balanço e Pórtico Simples
- **Diagramas de esforços internos** — Normal (N), Cortante (V) e Momento Fletor (M) sobrepostos na geometria 3D
- **Navegação 3D** — Rotação, zoom e pan com mouse
- **Ensino guiado passo a passo** — Explicações didáticas de cada elemento estrutural
- **Exercícios de fixação** — Quiz interativo com feedback imediato
- **Glossário estrutural** — Referência rápida de termos de engenharia

---

## 🚀 Como publicar no GitHub Pages

### Passo 1 – Criar o repositório

1. Acesse [github.com](https://github.com) e faça login
2. Clique em **New repository** (botão verde no canto superior direito)
3. Dê um nome ao repositório (ex: `estrutural-lab-3d`)
4. Deixe como **Public**
5. Clique em **Create repository**

### Passo 2 – Enviar os arquivos

**Opção A — Pelo site do GitHub (mais fácil):**
1. Na página do repositório recém-criado, clique em **uploading an existing file**
2. Arraste os arquivos `index.html`, `.nojekyll` e `README.md` para a área de upload
3. Clique em **Commit changes**

**Opção B — Pelo terminal (Git):**
```bash
git init
git add .
git commit -m "Estrutural Lab 3D - versão inicial"
git branch -M main
git remote add origin https://github.com/<seu-usuario>/<nome-do-repositorio>.git
git push -u origin main
```

### Passo 3 – Ativar o GitHub Pages

1. No repositório, vá em **Settings** (aba superior)
2. No menu lateral, clique em **Pages**
3. Em **Source**, selecione **Deploy from a branch**
4. Em **Branch**, selecione `main` e pasta `/ (root)`
5. Clique em **Save**

Após alguns minutos, o site estará disponível em:
```
https://<seu-usuario>.github.io/<nome-do-repositorio>/
```

---

## 📁 Estrutura dos Arquivos

```
estrutural-lab-3d/
├── index.html     # Aplicação principal (arquivo único, autocontido)
├── .nojekyll      # Impede processamento Jekyll do GitHub Pages
└── README.md      # Este arquivo
```

---

## 🛠️ Tecnologias Utilizadas

Todas as dependências são carregadas via CDN — **nenhuma instalação necessária**.

| Biblioteca | Versão | Finalidade |
|---|---|---|
| React | 18.2.0 | Interface e estado da aplicação |
| React Three Fiber | 8.15.12 | Renderização 3D no React |
| Three.js | 0.160.0 | Motor gráfico 3D |
| Drei | 9.96.1 | Helpers 3D (controles, grid, sombras) |
| Tailwind CSS | CDN | Estilização da interface |
| Babel Standalone | 7.23.10 | Compilação de JSX/TypeScript no browser |
| Lucide React | 0.323.0 | Ícones da interface |

---

## ℹ️ Observações

- Os valores de esforços internos são **pré-calculados para fins didáticos**
- Funciona em qualquer navegador moderno com suporte a ES Modules (Chrome, Firefox, Edge, Safari)
- Não requer servidor local, banco de dados ou instalação de dependências
