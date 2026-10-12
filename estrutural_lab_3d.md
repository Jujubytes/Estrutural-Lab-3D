/\* STREAMING_CHUNK: Imports & Setup \*/
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
OrbitControls,
Line,
Text,
Html,
Environment,
Grid,
ContactShadows
} from '@react-three/drei';
import \* as THREE from 'three';
import {
Activity,
BookOpen,
BoxSelect,
CheckCircle2,
ChevronRight,
Info,
Layers,
MousePointer2,
Play,
Rotate3D,
Ruler,
Settings2,
GraduationCap
} from 'lucide-react';

/\* STREAMING_CHUNK: Data Definitions & Structural Models \*/
// Tipos e Interfaces
type SupportType = 'pinned' | 'roller' | 'fixed' | 'none';
type DiagramType = 'none' | 'N' | 'V' | 'M';

interface Node {
id: string;
x: number;
y: number;
z: number;
}

interface Element {
id: string;
n1: string;
n2: string;
}

interface SupportCondition {
nodeId: string;
type: SupportType;
angle?: number; // Rotação do apoio em graus (0 = padrão, 90 = vertical, etc)
}

interface Load {
id: string;
nodeId?: string; // Para cargas concentradas
elementId?: string; // Para cargas distribuídas
type: 'point' | 'distributed' | 'moment';
dir: \[number, number, number\]; // Vetor direção
val: number;
posOffset?: number; // Posição relativa na barra (0 a 1) para cargas na barra
label: string;
}

interface DiagramData {
axis: \[number, number, number\]\[\]; // Pontos \[x,y,z\] do eixo da barra
values: number\[\]; // Valores correspondentes aos pontos do eixo
}

interface StructuralModel {
id: string;
title: string;
type: 'beam' | 'frame';
description: string;
nodes: Node\[\];
elements: Element\[\];
supports: SupportCondition\[\];
loads: Load\[\];
diagrams: {
N: Record<string, DiagramData>; // elementId -> DiagramData
V: Record<string, DiagramData>;
M: Record<string, DiagramData>;
};
learningSteps: { title: string; text: string; targetId?: string }\[\];
}

// Catálogo de Modelos Didáticos Pré-calculados
const MODELS: Record<string, StructuralModel> = {
'beam-simply-supported': {
id: 'beam-simply-supported',
title: 'Viga Biapoiada Simples',
type: 'beam',
description: 'O modelo mais clássico: uma viga isostática com um apoio do 2º gênero e um do 1º gênero.',
nodes: \[
{ id: 'n1', x: -4, y: 0, z: 0 },
{ id: 'n2', x: 0, y: 0, z: 0 },
{ id: 'n3', x: 4, y: 0, z: 0 }
\],
elements: \[
{ id: 'e1', n1: 'n1', n2: 'n2' },
{ id: 'e2', n1: 'n2', n2: 'n3' }
\],
supports: \[
{ nodeId: 'n1', type: 'pinned' },
{ nodeId: 'n3', type: 'roller' }
\],
loads: \[
{ id: 'l1', nodeId: 'n2', type: 'point', dir: \[0, -1, 0\], val: 10, label: '10 kN' }
\],
diagrams: {
N: {},
V: {
'e1': { axis: \[\[-4,0,0\], \[0,0,0\]\], values: \[5, 5\] },
'e2': { axis: \[\[0,0,0\], \[4,0,0\]\], values: \[-5, -5\] }
},
M: {
// Convenção: Momento positivo desenhado para baixo (lado tracionado)
'e1': { axis: \[\[-4,0,0\], \[0,0,0\]\], values: \[0, -20\] },
'e2': { axis: \[\[0,0,0\], \[4,0,0\]\], values: \[-20, 0\] }
}
},
learningSteps: \[
{ title: 'A Estrutura', text: 'Esta é uma viga biapoiada de 8 metros com uma carga concentrada bem no meio.' },
{ title: 'Apoio Articulado (Nó Esquerdo)', text: 'Restringe movimentos em X e Y, mas permite que a viga rotacione. Fornece duas reações (Vertical e Horizontal).', targetId: 'sup-n1' },
{ title: 'Apoio Móvel (Nó Direito)', text: 'Restringe apenas o movimento vertical (Y). Permite translação horizontal e rotação. Fornece apenas reação Vertical.', targetId: 'sup-n3' },
{ title: 'Carga Aplicada', text: 'Uma força de 10 kN atua no centro, empurrando a viga para baixo.', targetId: 'load-l1' },
{ title: 'Esforço Cortante (V)', text: 'Metade da carga vai para cada apoio (5 kN). O cortante é constante e positivo (+5) até o meio, onde a carga atua e o faz cair para (-5).' },
{ title: 'Momento Fletor (M)', text: 'O momento é máximo no meio da viga, sob a carga (20 kNm). A viga "sorri" (tração embaixo), logo o momento é positivo e desenhado para baixo na nossa convenção.' }
\]
},
'beam-cantilever': {
id: 'beam-cantilever',
title: 'Viga em Balanço',
type: 'beam',
description: 'Viga engastada em uma extremidade e livre na outra.',
nodes: \[
{ id: 'n1', x: -3, y: 0, z: 0 },
{ id: 'n2', x: 3, y: 0, z: 0 }
\],
elements: \[
{ id: 'e1', n1: 'n1', n2: 'n2' }
\],
supports: \[
{ nodeId: 'n1', type: 'fixed' }
\],
loads: \[
{ id: 'l1', nodeId: 'n2', type: 'point', dir: \[0, -1, 0\], val: 15, label: '15 kN' }
\],
diagrams: {
N: {},
V: {
'e1': { axis: \[\[-3,0,0\], \[3,0,0\]\], values: \[15, 15\] }
},
M: {
// Momento negativo, traciona a fibra superior, desenhado para cima
'e1': { axis: \[\[-3,0,0\], \[3,0,0\]\], values: \[90, 0\] }
}
},
learningSteps: \[
{ title: 'Engaste', text: 'O engaste (nó esquerdo) bloqueia todos os movimentos: X, Y e Rotação. Ele deve absorver todo o impacto da carga.', targetId: 'sup-n1' },
{ title: 'Momento Fletor', text: 'Como a carga empurra a ponta para baixo, a viga "chora" (tração em cima). O momento é negativo e máximo no engaste, diminuindo até zero na ponta livre.' }
\]
},
'frame-simple': {
id: 'frame-simple',
title: 'Pórtico Simples',
type: 'frame',
description: 'Pórtico plano com bases articuladas sujeito a força horizontal (vento).',
nodes: \[
{ id: 'n1', x: -3, y: -4, z: 0 },
{ id: 'n2', x: 3, y: -4, z: 0 },
{ id: 'n3', x: -3, y: 2, z: 0 },
{ id: 'n4', x: 3, y: 2, z: 0 }
\],
elements: \[
{ id: 'p1', n1: 'n1', n2: 'n3' }, // Pilar esq
{ id: 'p2', n2: 'n4' },           // Pilar dir (n1 para n2 está errado no id, mas tratado abaixo)
{ id: 'v1', n1: 'n3', n2: 'n4' }  // Viga
\],
supports: \[
{ nodeId: 'n1', type: 'pinned' },
{ nodeId: 'n2', type: 'pinned' }
\],
loads: \[
{ id: 'l1', nodeId: 'n3', type: 'point', dir: \[1, 0, 0\], val: 12, label: '12 kN (Vento)' }
\],
diagrams: {
N: {
'p1': { axis: \[\[-3,-4,0\], \[-3,2,0\]\], values: \[-6, -6\] }, // Tração/Compressão
'p2': { axis: \[\[3,-4,0\], \[3,2,0\]\], values: \[6, 6\] },
'v1': { axis: \[\[-3,2,0\], \[3,2,0\]\], values: \[6, 6\] }
},
V: {
'p1': { axis: \[\[-3,-4,0\], \[-3,2,0\]\], values: \[6, 6\] },
'p2': { axis: \[\[3,-4,0\], \[3,2,0\]\], values: \[6, 6\] },
'v1': { axis: \[\[-3,2,0\], \[3,2,0\]\], values: \[-6, -6\] }
},
M: {
'p1': { axis: \[\[-3,-4,0\], \[-3,2,0\]\], values: \[0, 36\] }, // Valores representativos para o visual
'p2': { axis: \[\[3,-4,0\], \[3,2,0\]\], values: \[0, 36\] },
'v1': { axis: \[\[-3,2,0\], \[3,2,0\]\], values: \[36, -36\] }
}
},
learningSteps: \[
{ title: 'Força Lateral', text: 'A força de 12 kN no topo simula vento ou impacto lateral.', targetId: 'load-l1' },
{ title: 'Apoios Articulados', text: 'Como as bases não são engastadas, elas não resistem a momento, apenas a forças X e Y. O momento fletor na base será zero.' },
{ title: 'Esforço Normal (N)', text: 'O vento tenta "tombar" o pórtico. O pilar esquerdo é tracionado e o direito é comprimido para manter o equilíbrio.' }
\]
}
};
// Corrigindo a declaração do pilar 2 para segurança no loop
MODELS\['frame-simple'\].elements\[1\] = { id: 'p2', n1: 'n2', n2: 'n4' };

/\* STREAMING_CHUNK: Constants & Helpers \*/
const COLORS = {
beam: '#94a3b8',
node: '#334155',
supportPinned: '#10b981', // Verde
supportRoller: '#3b82f6', // Azul
supportFixed: '#f59e0b',  // Laranja
load: '#ef4444',          // Vermelho
diagramN: '#3b82f6',      // Azul
diagramV: '#10b981',      // Verde
diagramM: '#f59e0b',      // Laranja/Amarelo
textDark: '#1e293b',
textLight: '#f8fafc'
};

const INFO_DIC = {
'pinned': { name: 'Apoio Articulado (2º Gênero)', desc: 'Impede translação em X e Y. Permite rotação.', rx: 'Sim', ry: 'Sim', rm: 'Não' },
'roller': { name: 'Apoio Móvel (1º Gênero)', desc: 'Impede translação perpendicular ao apoio (geralmente Y). Permite movimento rasante e rotação.', rx: 'Não', ry: 'Sim', rm: 'Não' },
'fixed': { name: 'Engaste (3º Gênero)', desc: 'Impede todas as translações (X, Y) e também impede a rotação.', rx: 'Sim', ry: 'Sim', rm: 'Sim' }
};

/\* STREAMING_CHUNK: 3D Components - Structure Elements \*/

// Seta de Carga 3D
const LoadArrow = ({ start, dir, label, id, onSelect }: { start: number\[\], dir: number\[\], label: string, id: string, onSelect: (id:string)=>void }) => {
// Calcular rotação da seta com base no vetor direção
const arrowLength = 1.5;
const direction = new THREE.Vector3(...dir).normalize();
const position = new THREE.Vector3(
start\[0\] - direction.x \* arrowLength,
start\[1\] - direction.y \* arrowLength,
start\[2\] - direction.z \* arrowLength
);

const quaternion = new THREE.Quaternion().setFromUnitVectors(
new THREE.Vector3(0, -1, 0), // Posição padrão da seta (apontando pra baixo)
direction
);

return (
<group position={position} quaternion={quaternion} onClick={(e) => { e.stopPropagation(); onSelect(`load-${id}`); }}>
{/\* Corpo da Seta */}
<mesh position={\[0, arrowLength / 2, 0\]}>
<cylinderGeometry args={\[0.05, 0.05, arrowLength, 12\]} />


{/* Ponta da Seta */}
<mesh position={\[0, 0, 0\]}>
<coneGeometry args={\[0.2, 0.4, 16\]} />


{/* Rótulo numérico \*/}
<Text
position={\[0.5, arrowLength / 2, 0\]}
color={COLORS.load}
fontSize={0.4}
anchorX="left"
anchorY="middle"
outlineWidth={0.02}
outlineColor="#ffffff"
>
{label}


);
};

// Apoios 3D
const SupportMesh = ({ type, position, angle = 0, id, onSelect }: { type: SupportType, position: number\[\], angle?: number, id: string, onSelect: (id:string)=>void }) => {
const rotZ = (angle \* Math.PI) / 180;

if (type === 'none') return null;

return (
<group position={new THREE.Vector3(...position)} rotation={\[0, 0, rotZ\]} onClick={(e) => { e.stopPropagation(); onSelect(`sup-${id}`); }}>
{type === 'pinned' && (
<group position={\[0, -0.4, 0\]}>
<mesh position={\[0, 0.2, 0\]}>
<coneGeometry args={\[0.3, 0.4, 4\]} />


<mesh position={\[0, 0, 0\]}>
<boxGeometry args={\[0.8, 0.1, 0.5\]} />



)}

```
  {type === 'roller' && (
    <group position={[0, -0.5, 0]}>
      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.3, 0.4, 4]} />
        <meshStandardMaterial color={COLORS.supportRoller} roughness={0.7} />
      </mesh>
      {/* Rolos */}
      <mesh position={[-0.2, 0.05, 0]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 16]} />
        <meshStandardMaterial color={COLORS.supportRoller} />
      </mesh>
      <mesh position={[0.2, 0.05, 0]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 16]} />
        <meshStandardMaterial color={COLORS.supportRoller} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.8, 0.05, 0.5]} />
        <meshStandardMaterial color={COLORS.supportRoller} />
      </mesh>
    </group>
  )}

  {type === 'fixed' && (
    <group position={[-0.2, 0, 0]}>
       <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.4, 1.2, 0.6]} />
        <meshStandardMaterial color={COLORS.supportFixed} />
      </mesh>
      {/* Hachuras visuais representadas por pequenas linhas no engaste */}
      <mesh position={[-0.22, 0, 0]}>
        <boxGeometry args={[0.05, 1.4, 0.7]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
    </group>
  )}
</group>

```

);
};

/\* STREAMING_CHUNK: 3D Components - Diagrams \*/
const Diagram3D = ({ data, type, scaleMultiplier = 0.05 }: { data: DiagramData, type: DiagramType, scaleMultiplier?: number }) => {
if (!data || data.axis.length < 2) return null;

let color = COLORS.diagramV;
if (type === 'N') color = COLORS.diagramN;
if (type === 'M') color = COLORS.diagramM;

const points: THREE.Vector3\[\] = \[\];
const hatchLines: THREE.Vector3\[\]\[\] = \[\];

// Constrói o polígono do diagrama
const pStart = new THREE.Vector3(...data.axis\[0\]);
const pEnd = new THREE.Vector3(...data.axis\[data.axis.length - 1\]);

// Normal vetorial à barra (simplificado para 2D no plano XY)
const dir = pEnd.clone().sub(pStart).normalize();
const normal = new THREE.Vector3(-dir.y, dir.x, 0); // Perpendicular em XY

// Escala para os diagramas não engolirem a tela
const maxVal = Math.max(...data.values.map(v => Math.abs(v)));
const dynamicScale = maxVal > 0 ? (1.5 / maxVal) : 1;

const scaledValues = data.values.map(v => v \* dynamicScale);

// Adiciona ponto inicial na barra
points.push(new THREE.Vector3(...data.axis\[0\]));

for (let i = 0; i < data.axis.length; i++) {
const baseP = new THREE.Vector3(...data.axis\[i\]);
const val = scaledValues\[i\];

```
// Desloca na direção normal de acordo com o valor
const diagP = baseP.clone().add(normal.clone().multiplyScalar(val));
points.push(diagP);

// Linha de hachura (hatching) para preenchimento visual
// Se a distância entre pontos for longa, interpolamos hachuras
if (i > 0) {
  const prevBase = new THREE.Vector3(...data.axis[i-1]);
  const prevVal = scaledValues[i-1];
  const segments = 10;
  for (let j = 1; j <= segments; j++) {
    const t = j / segments;
    const interpBase = prevBase.clone().lerp(baseP, t);
    const interpVal = prevVal + (val - prevVal) * t;
    const interpDiag = interpBase.clone().add(normal.clone().multiplyScalar(interpVal));
    hatchLines.push([interpBase, interpDiag]);
  }
}

```

}

// Fecha o polígono voltando ao eixo
points.push(new THREE.Vector3(...data.axis\[data.axis.length - 1\]));
points.push(new THREE.Vector3(...data.axis\[0\]));

return (

{/\* Contorno do Diagrama \*/}

```
  {/* Hachuras (Preenchimento) */}
  {hatchLines.map((linePts, idx) => (
    <Line key={idx} points={linePts} color={color} lineWidth={1} opacity={0.3} transparent />
  ))}
  
  {/* Rótulos dos Valores Máximos */}
  {data.axis.map((pos, idx) => {
    if (idx === 0 || idx === data.axis.length - 1 || data.values[idx] !== data.values[idx-1]) {
       const val = data.values[idx];
       if(val === 0) return null;
       const baseP = new THREE.Vector3(...pos);
       const diagP = baseP.clone().add(normal.clone().multiplyScalar(scaledValues[idx] * 1.1));
       return (
         <Text key={`txt-${idx}`} position={diagP} color={color} fontSize={0.3} outlineWidth={0.02} outlineColor="#fff">
           {Math.abs(val).toFixed(1)}
         </Text>
       );
    }
    return null;
  })}
</group>

```

);
};

/\* STREAMING_CHUNK: 3D Scene Assembly \*/
const StructureScene = ({
model,
activeDiagram,
onElementClick
}: {
model: StructuralModel,
activeDiagram: DiagramType,
onElementClick: (id: string) => void
}) => {
const { nodes, elements, supports, loads, diagrams } = model;

// Map para busca rápida de nós
const nodeMap = new Map<string, Node>(nodes.map(n => \[n.id, n\]));

return (
<group position={\[0, 0, 0\]}>
{/\* Desenha as Barras (Vigas/Pilares) \*/}
{elements.map(el => {
const n1 = nodeMap.get(el.n1);
const n2 = nodeMap.get(el.n2);
if (!n1 || !n2) return null;

```
    const p1 = new THREE.Vector3(n1.x, n1.y, n1.z);
    const p2 = new THREE.Vector3(n2.x, n2.y, n2.z);
    const distance = p1.distanceTo(p2);
    const center = p1.clone().lerp(p2, 0.5);
    
    // Quaternio para rotacionar o cilindro de Y para a direção da barra
    const direction = p2.clone().sub(p1).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

    return (
      <group key={el.id}>
        <mesh position={center} quaternion={quaternion} onClick={(e) => { e.stopPropagation(); onElementClick(`el-${el.id}`); }}>
          <cylinderGeometry args={[0.1, 0.1, distance, 12]} />
          <meshStandardMaterial color={COLORS.beam} metalness={0.5} roughness={0.2} />
        </mesh>
        
        {/* Renderiza Diagrama se ativo para este elemento */}
        {activeDiagram !== 'none' && diagrams[activeDiagram] && diagrams[activeDiagram][el.id] && (
          <Diagram3D data={diagrams[activeDiagram][el.id]} type={activeDiagram} />
        )}
      </group>
    );
  })}

  {/* Desenha os Nós (Visual) */}
  {nodes.map(n => (
    <mesh key={n.id} position={[n.x, n.y, n.z]}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial color={COLORS.node} />
    </mesh>
  ))}

  {/* Desenha os Apoios */}
  {supports.map((sup, i) => {
    const n = nodeMap.get(sup.nodeId);
    if (!n) return null;
    // Se for engaste e estiver em um nó com X alto, inverte para visualizar melhor (simples lógica visual)
    let angle = sup.angle || 0;
    if (sup.type === 'fixed' && n.x > 0 && model.type === 'beam') angle = 180; 

    return (
      <SupportMesh key={`sup-${i}`} id={n.id} type={sup.type} position={[n.x, n.y, n.z]} angle={angle} onSelect={onElementClick} />
    );
  })}

  {/* Desenha as Cargas */}
  {loads.map(load => {
    const n = nodeMap.get(load.nodeId || '');
    if (!n) return null;
    return (
      <LoadArrow key={load.id} id={load.id} start={[n.x, n.y, n.z]} dir={load.dir} label={load.label} onSelect={onElementClick} />
    );
  })}
</group>

```

);
};

/\* STREAMING_CHUNK: Main UI & State Management \*/
export default function App() {
const \[currentView, setCurrentView\] = useState<'home' | 'lab' | 'quiz' | 'glossary'>('home');
const \[activeModelId, setActiveModelId\] = useState('beam-simply-supported');
const \[activeDiagram, setActiveDiagram\] = useState('none');
const \[selectedElementId, setSelectedElementId\] = useState<string | null>(null);
const \[learningStepIndex, setLearningStepIndex\] = useState(0);
const \[isGuidedMode, setIsGuidedMode\] = useState(true);

const activeModel = MODELS\[activeModelId\];

// Reseta estados ao mudar de modelo
useEffect(() => {
setActiveDiagram('none');
setSelectedElementId(null);
setLearningStepIndex(0);
}, \[activeModelId\]);

const handleElementClick = (id: string) => {
setSelectedElementId(id);
};

const nextStep = () => {
if (learningStepIndex < activeModel.learningSteps.length - 1) {
setLearningStepIndex(prev => prev + 1);
const step = activeModel.learningSteps\[learningStepIndex + 1\];
if (step.targetId) setSelectedElementId(step.targetId);
else setSelectedElementId(null);
}
};

const prevStep = () => {
if (learningStepIndex > 0) {
setLearningStepIndex(prev => prev - 1);
const step = activeModel.learningSteps\[learningStepIndex - 1\];
if (step.targetId) setSelectedElementId(step.targetId);
else setSelectedElementId(null);
}
};

/\* STREAMING_CHUNK: Sub-views (Home, Quiz, Glossary) \*/
const HomeView = () => (








Estrutural Lab 3D


Laboratório virtual interativo para estudantes de Engenharia Civil. Visualize vigas e pórticos, explore os tipos de apoios e entenda a fundo os diagramas de esforços internos.

```
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
      <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
        <Layers className="text-blue-400 mb-3" size={32} />
        <h3 className="text-lg font-bold mb-2">Modelos 3D</h3>
        <p className="text-sm text-slate-400">Interaja com estruturas tridimensionais, gire, aproxime e investigue os nós e apoios.</p>
      </div>
      <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
        <Activity className="text-emerald-400 mb-3" size={32} />
        <h3 className="text-lg font-bold mb-2">Diagramas N, V, M</h3>
        <p className="text-sm text-slate-400">Sobreponha diagramas de esforços normais, cortantes e momentos fletores direto na geometria.</p>
      </div>
      <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
        <GraduationCap className="text-amber-400 mb-3" size={32} />
        <h3 className="text-lg font-bold mb-2">Ensino Guiado</h3>
        <p className="text-sm text-slate-400">Aprenda passo a passo o comportamento estrutural com exemplos clássicos de mecânica.</p>
      </div>
    </div>

    <button 
      onClick={() => setCurrentView('lab')}
      className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-900/50 flex items-center mx-auto"
    >
      Entrar no Laboratório <ChevronRight className="ml-2" />
    </button>
  </div>
</div>

```

);

const QuizView = () => {
const \[qIndex, setQIndex\] = useState(0);
const \[selectedA, setSelectedA\] = useState<number | null>(null);
const \[showExplanation, setShowExplanation\] = useState(false);

```
const questions = [
  {
    q: "Qual apoio impede translações no plano (X e Y), mas permite rotação (momento)?",
    opts: ["Apoio Móvel (1º Gênero)", "Apoio Articulado (2º Gênero)", "Engaste (3º Gênero)"],
    ans: 1,
    exp: "O apoio articulado fornece reações em X e Y, mas como não resiste a momentos, ele permite que a barra rotacione livremente na sua extremidade."
  },
  {
    q: "Na convenção estrutural clássica brasileira, o diagrama de momento fletor POSITIVO é desenhado:",
    opts: ["Do lado comprimido da barra (geralmente acima)", "Do lado tracionado da barra (geralmente abaixo)", "Independe da tração, sempre acima"],
    ans: 1,
    exp: "Para vigas horizontais com cargas gravitacionais, a fibra inferior traciona (momento positivo) e o diagrama é desenhado para baixo, acompanhando o lado da fibra tracionada."
  },
  {
    q: "Em uma viga biapoiada sujeita a uma carga pontual no centro, o diagrama de Esforço Cortante apresenta:",
    opts: ["Uma parábola contínua", "Um valor constante que muda de sinal sob a carga", "Zero em toda a extensão"],
    ans: 1,
    exp: "O cortante (V) representa a derivada do momento. Sendo o momento linear entre apoios e a carga, o cortante é constante. Ao passar pela carga pontual, há um salto (descontinuidade) no diagrama, invertendo o sinal."
  }
];

const currentQ = questions[qIndex];

return (
  <div className="flex-1 p-10 overflow-y-auto bg-slate-900 text-slate-200">
    <h2 className="text-3xl font-bold mb-8 flex items-center"><CheckCircle2 className="mr-3 text-emerald-400"/> Exercícios de Fixação</h2>
    
    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-2xl mx-auto shadow-xl">
      <div className="mb-4 text-sm text-blue-400 font-semibold">Questão {qIndex + 1} de {questions.length}</div>
      <h3 className="text-xl font-medium mb-6 leading-relaxed">{currentQ.q}</h3>
      
      <div className="space-y-3">
        {currentQ.opts.map((opt, i) => (
          <button
            key={i}
            onClick={() => !showExplanation && setSelectedA(i)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              showExplanation
                ? i === currentQ.ans
                  ? 'bg-emerald-900/50 border-emerald-500 text-emerald-100'
                  : i === selectedA
                    ? 'bg-red-900/50 border-red-500 text-red-100'
                    : 'bg-slate-700/30 border-slate-600 opacity-50'
                : selectedA === i
                  ? 'bg-blue-600/30 border-blue-500'
                  : 'bg-slate-700/50 border-slate-600 hover:bg-slate-600'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {!showExplanation && selectedA !== null && (
        <button 
          onClick={() => setShowExplanation(true)}
          className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors"
        >
          Confirmar Resposta
        </button>
      )}

      {showExplanation && (
        <div className={`mt-6 p-5 rounded-xl border ${selectedA === currentQ.ans ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
          <h4 className={`font-bold mb-2 ${selectedA === currentQ.ans ? 'text-emerald-400' : 'text-red-400'}`}>
            {selectedA === currentQ.ans ? 'Correto!' : 'Incorreto.'}
          </h4>
          <p className="text-slate-300">{currentQ.exp}</p>
          
          <button 
            onClick={() => {
              if (qIndex < questions.length - 1) {
                setQIndex(qIndex + 1);
                setSelectedA(null);
                setShowExplanation(false);
              } else {
                alert("Você concluiu os exercícios!");
                setCurrentView('home');
              }
            }}
            className="mt-4 px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors float-right"
          >
            {qIndex < questions.length - 1 ? 'Próxima Questão' : 'Finalizar'}
          </button>
          <div className="clear-both"></div>
        </div>
      )}
    </div>
  </div>
);

```

};

const GlossaryView = () => (

 Glossário Estrutural


Esforço Normal (N)
Força interna que atua paralelamente ao eixo da barra. Pode causar Tração (alongamento) ou Compressão (encurtamento). Ex: Peso em um pilar.


Esforço Cortante (V)
Força interna perpendicular ao eixo da barra. Representa a tendência de uma seção da viga "escorregar" sobre a outra adjacente.


Momento Fletor (M)
Esforço interno que causa a curvatura da barra. É gerado pela aplicação de forças perpendiculares a uma certa distância ou momentos aplicados diretamente.


Estrutura Isostática
Estrutura onde o número de reações de apoio é exatamente igual ao número de equações de equilíbrio estático disponíveis (geralmente 3 no plano).


Estrutura Hiperestática
Estrutura com mais restrições de apoio do que o estritamente necessário para o equilíbrio. Seu cálculo requer análise das deformações.



);

/\* STREAMING_CHUNK: Main Lab Layout \*/
return (

```
  {/* Sidebar - Navegação Secundária */}
  <div className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col shadow-xl z-20 relative">
    <div className="p-6 border-b border-slate-800 flex items-center">
      <Rotate3D className="text-blue-500 mr-3" size={28} />
      <h1 className="text-xl font-bold text-slate-100 tracking-tight">Lab. 3D</h1>
    </div>
    
    <nav className="flex-1 p-4 space-y-2">
      <button onClick={() => setCurrentView('home')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${currentView === 'home' ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
         <MousePointer2 className="mr-3" size={18} /> Início
      </button>
      <button onClick={() => setCurrentView('lab')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${currentView === 'lab' ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
         <BoxSelect className="mr-3" size={18} /> Laboratório
      </button>
      <button onClick={() => setCurrentView('quiz')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${currentView === 'quiz' ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
         <CheckCircle2 className="mr-3" size={18} /> Exercícios
      </button>
      <button onClick={() => setCurrentView('glossary')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${currentView === 'glossary' ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
         <BookOpen className="mr-3" size={18} /> Glossário
      </button>
    </nav>

    <div className="p-4 text-xs text-slate-500 border-t border-slate-800 text-center">
      Versão Didática • Eng. Civil
    </div>
  </div>

  {/* Main Content Area */}
  <div className="flex-1 flex relative">
    {currentView === 'home' && <HomeView />}
    {currentView === 'quiz' && <QuizView />}
    {currentView === 'glossary' && <GlossaryView />}

    {currentView === 'lab' && (
      <>
        {/* Overlay: Seleção de Modelo (Topo) */}
        <div className="absolute top-4 left-4 z-10 flex space-x-2 bg-slate-900/80 backdrop-blur-sm p-2 rounded-xl border border-slate-700 shadow-lg">
           {Object.values(MODELS).map(m => (
             <button
               key={m.id}
               onClick={() => setActiveModelId(m.id)}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeModelId === m.id ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-300 hover:bg-slate-700'}`}
             >
               {m.title}
             </button>
           ))}
        </div>

        {/* Canvas 3D */}
        <div className="flex-1 relative bg-gradient-to-b from-slate-900 to-slate-950">
          <Canvas camera={{ position: [5, 4, 10], fov: 45 }} className="w-full h-full">
            <color attach="background" args={['#0f172a']} /> {/* slate-950 */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <Grid infiniteGrid fadeDistance={40} sectionColor="#334155" cellColor="#1e293b" position={[0, -5, 0]} />
            
            <StructureScene 
              model={activeModel} 
              activeDiagram={activeDiagram}
              onElementClick={handleElementClick}
            />
            
            <OrbitControls makeDefault enablePan={true} enableZoom={true} />
            <ContactShadows position={[0, -4.9, 0]} opacity={0.4} scale={20} blur={2} far={10} />
          </Canvas>
          
          {/* Instrução visual flutuante */}
          <div className="absolute bottom-6 left-6 text-slate-400 text-sm flex items-center bg-slate-900/50 p-2 rounded-lg backdrop-blur-sm">
            <MousePointer2 size={16} className="mr-2" />
            Clique e arraste para girar a visualização 3D. Role para zoom.
          </div>
        </div>

        {/* Painel Direito (Controles e Aprendizado) */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-20 text-slate-200">
          
          {/* Título do Modelo */}
          <div className="p-6 border-b border-slate-800 bg-slate-800/30">
            <h2 className="text-xl font-bold mb-1 text-slate-100">{activeModel.title}</h2>
            <p className="text-xs text-slate-400">{activeModel.description}</p>
          </div>

          {/* Controles de Diagramas */}
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
              <Activity size={16} className="mr-2" /> Diagramas de Esforços
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => setActiveDiagram('none')}
                className={`p-2 text-xs font-bold rounded-lg border transition-all ${activeDiagram === 'none' ? 'bg-slate-700 border-slate-500 text-white shadow-inner' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
              >
                Oculto
              </button>
              <button 
                onClick={() => setActiveDiagram('N')}
                className={`p-2 text-xs font-bold rounded-lg border transition-all flex flex-col items-center justify-center ${activeDiagram === 'N' ? 'bg-blue-900/50 border-blue-500 text-blue-300 shadow-inner' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
              >
                <span>[ N ]</span>
                <span className="text-[10px] font-normal mt-1 opacity-70">Normal</span>
              </button>
              <button 
                onClick={() => setActiveDiagram('V')}
                className={`p-2 text-xs font-bold rounded-lg border transition-all flex flex-col items-center justify-center ${activeDiagram === 'V' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300 shadow-inner' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
              >
                <span>[ V ]</span>
                <span className="text-[10px] font-normal mt-1 opacity-70">Cortante</span>
              </button>
              <button 
                onClick={() => setActiveDiagram('M')}
                className={`p-2 text-xs font-bold rounded-lg border transition-all flex flex-col items-center justify-center ${activeDiagram === 'M' ? 'bg-amber-900/50 border-amber-500 text-amber-300 shadow-inner' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
              >
                <span>[ M ]</span>
                <span className="text-[10px] font-normal mt-1 opacity-70">Fletor</span>
              </button>
            </div>
          </div>

          {/* Área Dinâmica: Passo a passo OU Informações do elemento */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
            {selectedElementId && selectedElementId.startsWith('sup-') ? (
              // Info de Apoio Selecionado
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h3 className="font-bold text-lg mb-2 text-slate-100">
                  {INFO_DIC[activeModel.supports.find(s => s.nodeId === selectedElementId.split('-')[1])?.type as SupportType]?.name || 'Apoio'}
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  {INFO_DIC[activeModel.supports.find(s => s.nodeId === selectedElementId.split('-')[1])?.type as SupportType]?.desc || ''}
                </p>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-slate-900 p-2 rounded">
                    <span>Reação Horizontal (X)</span>
                    <span className={`font-bold ${INFO_DIC[activeModel.supports.find(s => s.nodeId === selectedElementId.split('-')[1])?.type as SupportType]?.rx === 'Sim' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {INFO_DIC[activeModel.supports.find(s => s.nodeId === selectedElementId.split('-')[1])?.type as SupportType]?.rx}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900 p-2 rounded">
                    <span>Reação Vertical (Y)</span>
                    <span className={`font-bold ${INFO_DIC[activeModel.supports.find(s => s.nodeId === selectedElementId.split('-')[1])?.type as SupportType]?.ry === 'Sim' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {INFO_DIC[activeModel.supports.find(s => s.nodeId === selectedElementId.split('-')[1])?.type as SupportType]?.ry}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900 p-2 rounded">
                    <span>Reação de Momento</span>
                    <span className={`font-bold ${INFO_DIC[activeModel.supports.find(s => s.nodeId === selectedElementId.split('-')[1])?.type as SupportType]?.rm === 'Sim' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {INFO_DIC[activeModel.supports.find(s => s.nodeId === selectedElementId.split('-')[1])?.type as SupportType]?.rm}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedElementId(null)} className="mt-4 text-xs text-blue-400 hover:text-blue-300 w-full text-center">Voltar ao tutorial</button>
              </div>
            ) : (
              // Tutorial Passo a Passo
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                    <Play size={16} className="mr-2" /> Aprenda Passo a Passo
                  </h3>
                  <div className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">
                    {learningStepIndex + 1} / {activeModel.learningSteps.length}
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-900/50 p-5 rounded-xl flex-1 relative">
                   <h4 className="text-blue-400 font-bold mb-3 text-lg">
                     {activeModel.learningSteps[learningStepIndex].title}
                   </h4>
                   <p className="text-sm text-slate-300 leading-relaxed">
                     {activeModel.learningSteps[learningStepIndex].text}
                   </p>
                </div>

                <div className="flex justify-between mt-4">
                  <button 
                    onClick={prevStep}
                    disabled={learningStepIndex === 0}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${learningStepIndex === 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
                  >
                    Anterior
                  </button>
                  <button 
                    onClick={nextStep}
                    disabled={learningStepIndex === activeModel.learningSteps.length - 1}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${learningStepIndex === activeModel.learningSteps.length - 1 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/50'}`}
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Rodapé do Painel */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 text-xs text-slate-500 text-center">
            <Info size={14} className="inline mr-1" /> Valores apenas para fins didáticos qualitativos.
          </div>

        </div>
      </>
    )}
  </div>
</div>

```

);
}