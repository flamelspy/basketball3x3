# Notas do projeto — Basketball 3x3

## v0.1.1 — distribuição HTML independente

Data de referência: 25/10/2026 (America/Sao_Paulo).

- Adicionado `npm run build:html`, que gera um único HTML com Three.js, Rapier/WASM, código e estilos incorporados.
- Não requer CDN, servidor HTTP ou Node.js para executar o arquivo exportado.
- Notas do projeto incorporadas no HTML como JSON de texto.
- Código de gameplay preservado nesta etapa de empacotamento.
- Verificação em Chromium com rede desabilitada e protocolo file://: inicialização, arremesso, pausa e controles mobile emulados aprovados, sem erros de JavaScript e sem requisições externas.
- A versão modular continua disponível para desenvolvimento e hospedagem.

## v0.1.0 — laboratório 1x1

Data de referência da entrega: 25/10/2026 (America/Sao_Paulo).

### Implementado

- Projeto Vite + TypeScript + Three.js + Rapier, com dependências fixadas por lockfile.
- Quadra de meia quadra com piso, tabela, aro e modelos articulados provisórios.
- Simulação em passo fixo separada da renderização.
- Controle de movimento, corrida, energia e separação simples entre atletas.
- Arremesso com preparação, tempo ideal de soltura, recuperação e trajetória física da bola.
- Contestação dependente da janela ativa, alcance e orientação do defensor.
- Enterrada com requisito de perfil, distância, energia, aproximação e interrupção por obstrução.
- Pontuação por travessia descendente do aro, sem duplicação da mesma cesta.
- Modo de ataque com defensor automático opcional e modo de defesa com atacante automático.
- Quatro perfis sintéticos configuráveis, sem dados de atletas históricos nesta fase.
- Indicadores de energia, tempo de ação, timing, alcance, pontos e aproveitamento.
- Controles de teclado, toque e suporte inicial a gamepad.
- Layout adaptado para telas menores, painel recolhido no início em celular, pausa e reposicionamento.
- Documentação de execução, parâmetros e limitações.
- Workflow de GitHub Actions para testes e compilação.

### Verificação realizada

- TypeScript e compilação de produção: aprovados.
- Sete testes automatizados aprovados: fases do arremesso; janela/distância/orientação da contestação; requisitos da enterrada; cesta descendente única; separação e limites da quadra; ataque da IA; conclusão de enterrada livre.
- Execução em Chromium headless com WebGL por software: inicialização, arremesso via teclado, pausa/continuação e tentativa da IA verificadas sem erros de JavaScript.
- Emulação de tela 390 × 844 com toque: painel inicialmente recolhido, botões visíveis, abertura de Ajustes e tentativa de arremesso por eventos de ponteiro verificadas.
- Conferência de imagens em desktop e retrato mobile.
- Controles reais, desempenho em GPU física e aparelhos móveis físicos ainda não testados.
- A execução do workflow remoto deve ser conferida no GitHub após o envio; a validação acima foi local.

### Limitações conhecidas

- Sem partida regulamentar completa, rebote controlável, passes, roubos, faltas, bandeja dedicada ou 3x3.
- A bola retorna automaticamente para uma nova tentativa após alguns segundos.
- Sem multiplayer, construtor completo, elenco histórico ou matriz final de counters.
- Animações procedurais, sem modelos GLB, IK ou captura de movimento.
- Contato entre atletas simplificado; colisores físicos da bola ainda não incluem o corpo dos jogadores.
- Bundle inicial grande por incluir o motor físico/WASM; o Vite emite aviso de tamanho.
- Rapier emite aviso interno de inicialização legada nesta versão da biblioteca, sem impedir a execução.
- Sem hospedagem pública configurada nesta entrega.

### Próximo marco

Refinar movimentação e contato, adicionar finalização de bandeja, rebotes e uma biblioteca de movimentos com modelos animados. A arquitetura de rede deverá ser ensaiada antes da expansão completa do elenco.
