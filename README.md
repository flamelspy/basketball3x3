# Basketball 3x3

Projeto de jogo de basquete 3x3 com construção de jogadores, arquétipos derivados do biotipo e das habilidades, confrontos entre estilos e ações baseadas em animações com tempo e alcance definidos.

**Estado:** laboratório 1x1 v0.1.0 implementado em Three.js + TypeScript + Rapier. Multiplayer e partida 3x3 ainda não implementados.

## Rodar o protótipo

Requer Node.js 22.12+ (ou 20.19+).

```sh
npm ci
npm run dev
```

Use WASD para mover, segure e solte Espaço para arremessar, F para enterrar e E para contestar no modo de defesa. Também há controles por toque e suporte inicial a gamepad.

Ajustes permite alternar ataque/defesa, escolher quatro perfis sintéticos e desativar a marcação automática. O treino exibe alcance, fase de ação, energia e timing.

Veja [controles, arquitetura e limitações](docs/PROTOTIPO.md) e [notas da versão](NOTAS-DO-PROJETO.md).

```sh
npm test
npm run build
npm run preview
```

A versão de produção é gerada em `dist/`. Ainda não há um endereço público de jogo configurado.

## HTML independente

```sh
npm run build:html
```

Gera `exports/basketball3x3_v0.1.1.html`, com JavaScript, CSS e física WebAssembly incorporados. Abra o arquivo em um navegador moderno, sem servidor ou instalação de dependências para jogar. O navegador precisa oferecer WebGL 2 e WebAssembly. Alguns visualizadores de arquivos do celular não executam HTML; abra no navegador.

## Visão

Criar partidas em que posicionamento, timing, habilidades individuais e composição do trio determinem as oportunidades de ataque e defesa. Começar com um laboratório offline 1x1, evoluir para 3x3 com IA e implementar multiplayer em uma fase posterior.

## Decisões de projeto confirmadas

- Modalidade principal: basquete 3x3.
- Construção de jogador semelhante em conceito à do NBA 2K: biotipo e habilidades determinam o arquétipo.
- Cada arquétipo terá pelo menos um counter-archetype eficiente contra suas ferramentas.
- As ações terão duração, fases e áreas de efetividade próprias.
- A distância de início de uma enterrada e o alcance de contestação serão parâmetros explícitos.
- Objetivo de elenco: 100 personagens baseados em uma curadoria dos maiores jogadores da história da NBA.
- Cada personagem terá uma referência individual. Alterar apenas nome e aparência, preservando características físicas e esportivas da referência.
- Preservar altura, peso, envergadura quando conhecida, proporções e composição corporal (magro, musculoso, robusto etc.), capacidades atléticas, habilidades, tendências e limitações.
- Modificar rosto, cor da pele, cabelo, barba, nome e identidade visual sem alterar o biotipo esportivo.
- Não misturar atletas para substituir o perfil individual escolhido.
- Aparência cosmética não determina atributos de desempenho.
- Multiplayer será desenvolvido depois do núcleo offline, com arquitetura preparada desde o início.

## Propostas ainda sujeitas a validação

- Meia quadra, uma cesta, partidas até 21 pontos e cestas de 1 e 2 pontos.
- Posse inicial de 12 segundos, configurável.
- Um jogador controlado e dois companheiros com IA no modo offline.
- Direção de arte final. Base técnica escolhida: navegador, Three.js, TypeScript, Rapier; teclado, toque e suporte inicial a controle.
- Temporada ou fase da carreira usada para representar cada referência histórica.
- Lista definitiva dos 100 atletas e método de conversão das habilidades em atributos.

Medidas históricas desconhecidas deverão ser registradas como estimativas, com fonte e nível de confiança, sem apresentar números inventados como fatos.

## Construção de jogadores

Fluxo: biotipo → limites de atributos → distribuição de pontos → arquétipo resultante → movimentos disponíveis.

O construtor de personagens personalizados terá orçamento de pontos e custos para cada capacidade. Esse orçamento é separado da reprodução dos perfis do elenco histórico; não deve alterar suas características para encaixá-los artificialmente em builds equivalentes.

| Componente | Efeitos a modelar |
| --- | --- |
| Altura e envergadura | Altura de soltura, alcance, finalizações e defesa |
| Massa, força e composição corporal | Contato e disputa de posição |
| Aceleração e agilidade | Primeiro passo, recuperação e mudança de direção |
| Impulsão | Alcance aéreo, rebote e finalização |
| Habilidades | Arremesso, passe, drible, post, defesa e rebote |
| Condicionamento | Custo e repetição dos esforços |

## Arquétipos e counters

Primeira hipótese de balanceamento; a matriz será ampliada e testada.

| Estilo | Counter principal | Mecanismo |
| --- | --- | --- |
| Arremessador de movimento | Marcador de perseguição | Acompanhar rotas e reduzir espaço de recepção |
| Criador de isolamento | Defensor de contenção | Fechar primeira passada e manter equilíbrio |
| Finalizador explosivo | Protetor de aro | Ocupar a trajetória e disputar a conclusão |
| Especialista de post | Defensor de post | Resistir ao avanço e dificultar a posição |
| Protetor de aro | Pivô espaçador | Obrigar o defensor a sair do garrafão |
| Pivô espaçador | Defensor móvel | Contestar fora e acompanhar infiltrações |

A vantagem será situacional, produzida pelas capacidades e pelo posicionamento, sem vitória automática por classe. Bloqueios, passes, ajuda e trocas de marcação permitem responder aos counters. Todos os arquétipos finais, inclusive os defensivos, precisarão de counters definidos.

## Contrato de ações e animações

Cada movimento deverá definir:

- Identificador, versão e requisitos de atributos.
- Condições de início: posição, orientação, velocidade, energia e posse.
- Preparação, janela ativa e recuperação, em unidades de tempo da simulação.
- Eventos: impulsão, contato, soltura, conclusão e aterrissagem.
- Área de efetividade: alcance, altura, direção, trajetória e volumes de colisão.
- Janelas de cancelamento e transições permitidas.
- Custo de energia, efeitos de fadiga e respostas a contato.
- Regras de interrupção, bloqueio, falta e falha.
- Relação entre deslocamento da animação, colisão e movimento simulado.

A distância de iniciação de uma enterrada não garante a cesta. O movimento deve atravessar o espaço e resolver os contatos. Contestações considerarão distância, direção, alcance da mão, altura de soltura, timing e obstáculos.

Valores iniciais de duração e alcance serão hipóteses de teste, sem compromisso com números antes do protótipo.

## Arquitetura proposta

Separar regras e simulação da apresentação. Organizar jogadores, arquétipos, movimentos, IA e configurações em módulos com interfaces explícitas e dados versionados.

Preparação para rede:
- Simulação em passo fixo.
- Comandos de entrada separados da renderização.
- Estados e fases de ações explícitos.
- Regras de posse, colisão e pontuação independentes da animação visual.
- Registro reproduzível de entradas e resultados; controlar a aleatoriedade.
- Servidor autoritativo para acontecimentos decisivos no multiplayer.
- Teste de sincronização e latência antes da produção completa do elenco.

## Roadmap

| Fase | Entrega | Critério de conclusão |
| --- | --- | --- |
| 0 — Especificação | Regras, controles, plataforma, motor e modelo de dados | Decisões essenciais documentadas e pendências identificadas |
| 1 — Laboratório 1x1 | Quadra simples, movimento, posse, arremesso, bandeja, enterrada e contestação | Ataque e defesa utilizáveis; tempos e áreas inspecionáveis |
| 2 — Builds e counters | Construtor inicial e perfis de teste | Custos e vantagens verificáveis; respostas viáveis aos estilos |
| 3 — 3x3 offline | Passe, bloqueio, rebote, IA, ajuda, trocas e pontuação | Partida completa sem intervenção técnica |
| 4 — Apresentação | Modelos, animações refinadas, câmera, som e interface | Leitura clara de contato, posse e timing |
| 5 — Elenco | Expansão de 12 para 30 e depois 100 personagens | Cada lote validado física, visual e tecnicamente |
| 6 — Multiplayer | Servidor, salas, sincronização e reconexão | Partidas coerentes sob condições de rede simuladas |
| 7 — Progressão | Evolução, desafios e novos ambientes | Progressão compatível com o equilíbrio competitivo |

O teste técnico de rede deverá ocorrer antes da expansão completa do elenco, mesmo que o modo online seja entregue posteriormente.

## Primeiro marco

Quadra de laboratório com quatro perfis provisórios: arremessador, infiltrador, marcador de perímetro e protetor de aro.

Validar:
1. Movimentação e relação entre jogador, bola e cesta.
2. Início, trajetória e interrupção de finalizações.
3. Alcance e timing de contestação.
4. Contato sem atravessamento ou deslocamentos artificiais.
5. Recuperação após ações e custo de repetir esforços.
6. Feedback visual das áreas e fases em modo de depuração.

## Produção do elenco

Cada ficha deverá registrar referência esportiva, fase da carreira, fontes, medidas, atributos, tendências, arquétipo, counters, movimentos e identidade fictícia.

Compartilhar uma biblioteca de movimentos com combinações e parâmetros individuais. Pacotes exclusivos de animação poderão ser considerados posteriormente.

## Próximas tarefas

- [x] Escolher plataforma-alvo e motor: navegador / Three.js.
- [x] Definir controles iniciais de teclado, toque e gamepad.
- [ ] Fechar regras do primeiro protótipo.
- [ ] Especificar dados de jogador e ação.
- [ ] Definir a máquina de estados de posse e movimentos.
- [x] Implementar o laboratório inicial 1x1 (escopo e limitações em docs/PROTOTIPO.md).
- [x] Visualizar alcance e timing.
- [ ] Ampliar a inspeção visual de contato.
- [ ] Definir métricas de teste dos arquétipos.

## Histórico

- 2026-10-25: planejamento inicial e roadmap registrados; preservação do biotipo e do perfil esportivo das referências confirmada, com alteração de nome e aparência.

A versão inicial possui testes automatizados de regras. Consulte as notas da versão para a validação realizada e as limitações.
