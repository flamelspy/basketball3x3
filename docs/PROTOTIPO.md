# Laboratório 1x1 — v0.1.0

## Executar

Requer Node.js 22.12 ou superior (ou 20.19+).

```sh
npm ci
npm run dev
```

Abra o endereço mostrado pelo Vite. Para testar no celular da mesma rede, abra o endereço de rede exibido pelo comando. O navegador precisa oferecer WebGL 2 e WebAssembly.

```sh
npm test
npm run build
npm run preview
```

A pasta `dist/` contém a versão estática para hospedar em um servidor HTTP. Não abra `index.html` diretamente pelo protocolo de arquivos. Não há hospedagem pública configurada nesta entrega.

## Arquivo HTML único

Execute `npm run build:html` para gerar `exports/basketball3x3_v0.1.1.html`. Este arquivo pode ser aberto diretamente no navegador, sem servidor, CDN ou conexão à internet. Three.js, Rapier/WebAssembly, código e estilos estão incorporados. Requer navegador com WebGL 2 e WebAssembly; visualizadores simples de anexos podem não executar o jogo.

O teste do HTML independente foi realizado com a rede desabilitada, abertura por `file://`, arremesso, pausa e controles mobile emulados, sem erros de JavaScript nem requisições externas. Testes em aparelhos físicos continuam pendentes.

## Controles

| Ação | Teclado | Controle padrão | Toque |
| --- | --- | --- | --- |
| Mover | WASD / setas | Analógico esquerdo | Direcional esquerdo |
| Correr | Shift | Gatilho direito | Ainda indisponível |
| Arremessar | Segurar / soltar Espaço | Segurar / soltar A | Segurar / soltar Arremesso |
| Enterrar | F | X | Enterrar |
| Contestar | E | B | Contestar |
| Reposicionar | R | Botão na interface | Botão na interface |
| Pausar | Esc / botão | Botão na interface | Botão na interface |

R reposiciona os jogadores sem apagar o acumulado de pontos. Os botões do controle usam o mapeamento padrão do navegador; a detecção depende do dispositivo e do navegador.

## Modos

- Ataque: jogador verde controlado; marcador laranja com IA opcional. Desative a marcação automática para treinar a soltura livre.
- Defesa: jogador laranja controlado; atacante verde se desloca e arremessa automaticamente.
- Os perfis de atacante e defensor são independentes e podem ser trocados em Ajustes.
- A curva verde mostra a região de iniciação da enterrada. O círculo laranja mostra o alcance máximo de contestação; fica claro durante a janela ativa. O círculo não significa que toda posição dentro dele tenha a mesma efetividade.

## Parâmetros iniciais

Todos são valores experimentais, não medições de atletas reais.

- Simulação fixa em 60 Hz.
- Soltura ideal: segurar 0,65 s; limite 1,35 s.
- Preparação após soltar: 0,18 s; recuperação: 0,46 s.
- Contestação: duração 0,72 s; janela ativa de 0,12 a 0,43 s.
- Enterrada: até 2,3 m, à frente do aro; conclusão em 0,68 s; duração total 1,12 s; custo 22 de energia.
- Distância, orientação, lado de aproximação e alcance influenciam a contestação.
- Erro de arremesso depende de timing, distância, habilidade, fadiga e contestação. Não existe garantia de cesta por animação.
- Pontos são registrados na travessia descendente do interior do aro. A física usa gravidade, tabela, aro segmentado e piso.

## Organização

- `src/core/config.ts`: perfis sintéticos e parâmetros das ações.
- `src/core/simulation.ts`: estado, ações, IA de treino, contato entre atletas e pontuação; sem dependência do DOM ou Three.js.
- `src/core/physics.ts`: mundo Rapier e bola.
- `src/view/scene.ts`: quadra, modelos articulados, animações procedurais e renderização Three.js.
- `src/input.ts`: teclado, toque e controle.
- `src/main.ts`: inicialização, interface e laço com passo fixo.
- `tests/simulation.test.ts`: verificações das regras centrais.

## Limites desta versão

- Laboratório de mecânicas; não é uma partida completa 1x1 nem 3x3.
- Sem rebote controlável, roubo, passe, bandeja dedicada, faltas ou relógio de posse.
- Bola recolocada automaticamente após cada tentativa.
- Apenas bola, piso, aro e tabela usam colisão Rapier. Atletas usam separação geométrica simples e interrupção da aproximação da enterrada.
- Animações procedurais provisórias; ainda sem GLB, retargeting, IK ou captura de movimentos.
- Quatro perfis sintéticos; nenhum representa um atleta histórico. A escolha das referências e a pesquisa de medidas não foram feitas.
- Construtor, matriz completa de counters e multiplayer ainda não implementados.
- Falta interpolação visual entre passos e predição de rede; o passo fixo prepara a separação da lógica, sem constituir uma implementação multiplayer.
- Movimentação simplificada; ainda sem aceleração, inércia e controle de passos regulamentares.
- O pacote Rapier inclui WebAssembly e aumenta o tamanho inicial do download; existe aviso de tamanho de bundle na compilação.
- Testes em aparelhos físicos e controles reais ainda necessários.
