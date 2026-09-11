# Session Log — MetricLab Vistoria Cautelar (PWA)

## Data: 09 de Setembro de 2026

### Objetivo
Reestruturar completamente o layout e a arquitetura de interface do PWA `jfsf-dev0/metriclab-vistoria-cautelar` para implementar o **Design System MetricLab 2.0** (referência: Runway + Linear), com paleta off-white/ink, inputs underline, tipografia refinada e layout flat.

---

### Design System MetricLab 2.0 Implementado
- **Tokens de Cor**:
  - `--canvas`: `#F7F7F5` (fundo de página — off-white quente)
  - `--surface`: `#FFFFFF` (fundo de cards quando necessário)
  - `--hairline`: `#E5E5E3` (divisores 1px)
  - `--hairline-soft`: `#EFEFED` (divisores sutis)
  - `--ink`: `#111111` (texto primário, botão primário)
  - `--ink-soft`: `#3A3A3A` (headings secundários)
  - `--graphite`: `#6B6B6B` (corpo de texto)
  - `--stone`: `#9B9B9B` (placeholder, meta, terciário)
  - `--ash`: `#C4C4C2` (elementos desativados)
  - `--accent`: `#F5A623` (amarelo MetricLab só no logo e `m.`)
- **Regras Estritas**:
  - Zero fundos azuis, verdes ou vermelhos em botões ou badges
  - Zero emojis na interface
  - Zero ícones em fundos coloridos
  - Zero bordas coloridas ou sombras pesadas
  - Inputs em estilo Runway underline (sem caixa, borda inferior 1px hairline, focus ink)
  - Botões primários em preto `#111111`, altura 48px, radius 6px
  - Barra de progresso linear de 2px preenchida em `#111111`

---

### Telas Atualizadas
1. **Splash (`/`)**:
   - Logo central `m.` com ponto amarelo `#F5A623` (32px)
   - Eyebrow "PROPOSTA" (11px stone uppercase)
   - Display "Pacote 15 e 19" (72px #111111, tracking -1.2px)
   - Subtítulo "Vistoria Cautelar" (15px graphite)
   - Linha hairline 1px e botão "Entrar" preto full-width (48px)
2. **Login (`/login`)**:
   - Layout sem card externo direto na página canvas
   - Heading "Acesso" (28px #111111) e subtítulo
   - Inputs underline para TELEFONE e CHAVE DE ACESSO
   - Botão "Entrar" preto full-width
3. **Trechos (`/trechos`)**:
   - Header minimalista com logo "m." e saudação
   - Eyebrow "TRECHOS DISPONÍVEIS" (11px stone)
   - Lista flat sem cards com divisores hairline 1px
   - Linhas com nome do trecho, quilometragem e chevron sutil
4. **Vistoria (`/vistoria/novo`)**:
   - Header com botão texto "← Voltar", nome do trecho e contador "1 de 5"
   - Barra de progresso de 2px preenchida em ink
   - Passo 1 (Identificação do Imóvel): Inputs underline para NÚMERO / LOTE, COMPLEMENTO, NOME DO MORADOR, perguntas em lista flat com botões Sim/Não (Idosos, Crianças, Desocupado, Acesso) e OBSERVAÇÕES INICIAIS
   - Passo 2 (Checklist de Vistoria): Lista accordion das 6 perguntas obrigatórias com estado inline expandido
   - Passo 3 (Fotos): Área de câmera dashed minimalista e grid de fotos com remoção
   - Passo 4 (Assinatura e Localização): Assinatura sobre canvas limpo (#1e3a5f, 2px) e geolocalização em texto simples
5. **Status (`/vistoria/[id]/status`)**:
   - Fundo canvas sem header e sem card
   - Estado Analisando ("ANALISANDO" pulsando), Aprovada ("APROVADA", Display 94 de 100, resumo lista flat) e Reprovada ("REPROVADA", 61 de 100, itens críticos)
   - Botões em preto 48px

---

### Migration Supabase Executada
- `ALTER TABLE demo_lote15_vistorias ADD COLUMN IF NOT EXISTS numero_lote, nome_morador, tem_idosos, tem_criancas, imovel_desocupado, acesso_disponivel;`

### Verificação
- Build Next.js 14 executado com sucesso e 0 erros de compilação ou tipagem.

---

## Data: 10 de Setembro de 2026

### Atualização do Fluxo de Login (Fiel ao Gestão)
- **Design System & Layout**:
  - Fundo `#F0F0F0`, card centralizado `bg-white`, border 1px `#E5E5E3`, radius 12px, padding 32px, max-width 380px.
  - Logo `m.` com ponto `#F5A623`, título "Vistoria Cautelar" e subtítulo "Pacote 15 e 19".
- **Fluxo com 3 Estados**:
  - **Estado 1 (Inicial)**: Campo underline "Email ou Telefone", dois botões lado a lado ("Entrar com chave" e "Código único"), divisor "ou" e botão preto full-width "Entrar".
  - **Estado 2A (Chave)**: Campo com código de acesso de 6 dígitos (autofocus, password, hint Demo: 123456), validação com bypass demo 123456 e consulta na tabela `demo_lote15_leads`. Shake animation caso inválido.
  - **Estado 2B (Código Único)**: Mensagem "Enviamos um código para...", campo de 6 dígitos com espaçamento monospace, bypass 123456 para demo e botão "Confirmar".
- **Splash (`/`)**:
  - Fundo `#F0F0F0`, display "Pacote 15 e 19", eyebrow "PROPOSTA", subtítulo e botão "Entrar" full-width.
- **Build & Verificação**:
  - `npm run build` executado com 0 erros TypeScript.

---

### Reestruturação da Home Unificada (Vistoria Cautelar)
- **Header (`app/home/page.tsx`)**:
  - Fundo `#FFFFFF`, borda inferior 1px `#E5E5E3`, padding 16px 20px, sem altura fixa (cresce com o conteúdo).
  - Linha 1: "Olá, [nome do usuário logado]." (Inter 22px 700 `#111111`, letter-spacing -0.5px).
  - Linha 2: "Consórcio Lote 15 · [trecho_nome]" (Inter 13px 400 `#9B9B9B`).
- **Barra de Pendências**:
  - Fundo `#FFFFFF`, borda inferior 1px `#E5E5E3`, padding 12px 20px.
  - 3 contadores em linha: Vistorias pendentes (status != 'aprovada'), Incidentes abertos (status = 'aberta') e RDOs pendentes (status = 'rascunho').
- **Feed — Últimas Ações**:
  - Fundo `#F0F0F0`, lista vertical sem card/sombra, separada por divisores hairline 1px `#E5E5E3`.
  - Mistura ordenada por `created_at DESC` de `demo_lote15_vistorias`, `demo_rdo_ocorrencias` e `demo_rdo_registros`.
  - Padding 14px 20px, background `#FFFFFF`, active state `#F7F7F7`.
  - Linha 1: Tipo + Trecho (Inter 14px 500 `#111111`) à esquerda, Data "DD/MM" (Inter 13px 400 `#9B9B9B`) à direita.
  - Linha 2: Detalhe secundário contextual (Endereço da vistoria `Rua ... N...`, Tipo/gravidade da ocorrência, Nome fictício do responsável + contagem de participantes para RDO).
- **Bottom Sheet Modal**:
  - Sobe da base cobrindo 85% da tela, border-radius 16px 16px 0 0, handle bar 40px × 4px `#E5E5E3`, backdrop com blur suave.
  - Layout customizado por tipo:
    - **Vistoria**: Título com trecho, endereço, lista flat de dados (CEP, Morador, Idosos, Crianças, Desocupado, Acesso, Observações) e grid de fotos 3 colunas (thumbnails 80px).
    - **Incidente**: Título com trecho, gravidade/tipo, status, data, bloco de descrição detalhada e fotos.
    - **RDO**: Título com trecho, data, status, turno, lista flat de participantes com funções e bloco de atividades.
- **Bottom Navigation (Fixed)**:
  - Altura 64px + safe-area-inset-bottom, background `#FFFFFF`, borda superior 1px `#E5E5E3`.
  - 4 itens:
    1. Vistoria (ícone Home, ativo `#111111`)
    2. RDO (ícone ClipboardList -> `/rdo/novo`)
    3. Incidente (ícone AlertTriangle -> `/ocorrencia`)
    4. Buscar (ícone Search -> ativa campo de busca no topo filtrando o feed em tempo real)
- **Rotas e Migrations**:
  - Rota `/home` protegida no `middleware.ts`.
  - `app/login/page.tsx` redirecionando para `/home`.
  - `app/trechos/page.tsx` redirecionando para `/home`.
  - Páginas ponte `/rdo/novo` e `/ocorrencia` criadas para navegação limpa.
  - Seed no Supabase com vistorias, ocorrências e registros de demonstração.
  - Arquivo de migração `supabase/migrations/20260910000000_add_rua_to_vistorias.sql`.

---

### Refatoração do Login com 4 Etapas Progressivas em Tela Única (`app/login/page.tsx`)
- **Arquitetura & Card Central Fixo**:
  - Fundo `#F0F0F0`, card centralizado absoluto com `top: 50%; left: 50%; transform: translate(-50%, -50%)`.
  - Dimensões: `max-width: 380px`, `width: calc(100% - 48px)`, `padding: 32px 28px`, `border-radius: 16px`, borda 1px `#E5E5E3`.
  - Transição de expansão vertical suave `transition: all 300ms ease`.
- **4 Etapas Progressivas Integradas**:
  - **Etapa 0 (Entrada)**: Card limpo com Logo `m.` (`m` em `#111111`, `.` em `#F5A623`, 28px 700), título "Vistoria Cautelar" (22px 700), subtítulo "Pacote 15 e 19" (13px 400 `#9B9B9B`), espaçamento de 32px e botão preto full-width "Entrar" (44px, radius 8px).
  - **Etapa 1 (Campo Email/Telefone)**: Expansão com fade-in suave, input underline sem caixa (15px, placeholder `seu@email.com ou +55 (11) 99999`, autofocus), botão "Entrar" desabilitado (`opacity: 0.35`, `pointer-events: none`) e text-link "← Voltar" (12px `#9B9B9B`) que retorna à Etapa 0.
  - **Etapa 2 (Escolha do Método)**: Disparo automático ao digitar qualquer caractere no campo, exibindo com fade-in (`opacity 0→1, translateY 6→0, 250ms ease`) dois botões lado a lado: "Entrar com chave" (ícone Lock 15px) e "Código único" (ícone Smartphone 15px), com legenda Demo "use o código 123456".
  - **Etapa 3A (Entrar com chave)**: Destaque visual no botão selecionado (`#F7F7F7` e borda `#111111`), label "CÓDIGO DE ACESSO" com hint Demo, input type password com tracking 4px e placeholder `••••••`. Botão "Entrar" ativa exclusivamente com 6 dígitos (`opacity: 1.0`, `pointer-events: auto`).
  - **Etapa 3B (Código único)**: Mensagem contextual "Código enviado para [identificador]", label "CÓDIGO RECEBIDO", input com tracking 6px e placeholder `000000`. Botão alternado para texto "Confirmar", ativando com 6 dígitos.
- **Validação e Redirecionamento**:
  - Aceite universal do código demo `123456` para qualquer input com criação de sessão do inspetor demo.
  - Consulta ao Supabase na tabela `demo_lote15_leads` por email/telefone e chave ativa.
  - Shake animation (`animate-shake`) e mensagem de erro "Código inválido" (12px `#DC2626`) em caso de falha.
  - Persistência no `localStorage` sob a chave `ml_vistoria_session` e redirecionamento para `/home`.
- **Verificação & Build**:
  - Eliminação da splash duplicada: `app/page.tsx` agora redireciona diretamente para `/login` (`redirect('/login')`), consolidando todo o fluxo de entrada e autenticação na tela única de `/login`.

---

### Implementação PWA Mobile Features (RFP: PWA-MOBILE-FEATURES-01)
- **1. Notificações Push**:
  - Solicitação de permissão de notificações nativas no primeiro acesso mobile via `PwaManager`.
  - Service Worker implementado em `public/sw.js` com listeners de eventos `push` (notificação rica com vibração, ícone e badge) e `notificationclick` (abertura/foco de aba).
  - Utilitário TypeScript `lib/pushNotifications.ts` com funções reutilizáveis:
    - `isPushSupported()`, `getNotificationPermission()`, `requestNotificationPermission()`.
    - `subscribeUserToPush(userId, contratoId)`: converte VAPID key para Uint8Array e registra inscrição push.
    - `sendNotification(title, body, data)`: dispara notificação local via Service Worker e remota via API.
  - Endpoint de API `app/api/pwa/subscription/route.ts` para persistência na tabela Supabase `pwa_subscriptions`.
  - Migration SQL `supabase/migrations/20260910000001_create_pwa_subscriptions.sql` com schema e RLS da tabela `pwa_subscriptions (id, user_id, contrato_id, endpoint, keys, created_at, updated_at)`.
  - Endpoint de integração `app/api/pwa/send-notification/route.ts` enviando payload para webhook do N8N (`N8N_PUSH_WEBHOOK_URL`).
  - Workflow exportável N8N criado em `n8n-workflows/WF-PWA-001-push-notifications.json`.

- **2. Bloqueio de Acesso por Computador**:
  - Middleware Next.js (`middleware.ts`) com detecção de User-Agent desktop aplicando bloqueio estritamente nas rotas protegidas (`/vistoria/*`).
  - Exceção para PWA standalone: se acessado com `display-mode: standalone` ou cookie `ml_pwa_standalone=true` ou query param `?mode=standalone`, o acesso é liberado normalmente.
  - Redirecionamento 307 para página dedicada `/desktop-blocked` com a mensagem exata:
    *"Este sistema é exclusivo para acesso mobile. Acesse pelo seu celular."*
  - Página `/desktop-blocked` desenhada no Design System MetricLab 2.0 (fundo `#F0F0F0`, card centralizado `#FFFFFF`, borda `#E5E5E3`, QR Code SVG inline escaneável para abrir o sistema no celular).

- **3. Banner "Adicionar à tela inicial" (PWA Install Banner)**:
  - Componente `components/pwa/PwaInstallBanner.tsx` capturando evento nativo do navegador `beforeinstallprompt`.
  - Estilização estrita no Design System MetricLab 2.0: fundo `#F0F0F0`, surface card `#FFFFFF`, borda `#E5E5E3`, botão preto `#111111`, tipografia Inter, sem emojis.
  - Exibição condicional: browser compatível com PWA, fora do modo standalone, em dispositivos mobile e não dispensado anteriormente.
  - Suporte com instruções para iOS Safari ("Compartilhar -> Adicionar à Tela de Início").
  - Persistência de dispensa no `localStorage` sob `ml_pwa_install_banner_dismissed`.
  - Integração no `app/layout.tsx` através do `<PwaManager />`.

---

### Bloqueio Total de Desktop em Todas as Telas (`/login`, `/`, `/home`, etc.)
- **Problema**: O link `https://vistoria.metriclab.com.br/login` e a rota raiz `/` ainda eram acessíveis no desktop porque a regra anterior limitava-se a `/vistoria/*`.
- **Solução Implementada**:
  - `middleware.ts`: Configuração do matcher global para interceptar todas as requisições à aplicação (exceto assets estáticos `_next`, `api`, `favicon.ico`, `sw.js`, `manifest.json` e a própria página `/desktop-blocked`).
  - Bloqueio imediato no middleware com redirecionamento HTTP 307 para `/desktop-blocked` em qualquer tela (`/login`, `/`, `/home`, `/trechos`, etc.) se o acesso for desktop e fora do modo standalone.
  - `PwaManager.tsx`: Adicionada proteção dupla no cliente (hydration guard) para redirecionar instantaneamente para `/desktop-blocked` caso ocorra renderização em navegador desktop sem modo standalone.
  - `app/desktop-blocked/page.tsx`: Se acessado por dispositivo móvel, redireciona automaticamente para `/login`; se em modo standalone no computador, redireciona para `/login`.

---

### Redesenho da Página /desktop-blocked (Tela Completa & QR Code Funcional)
- **Layout Desktop Tela Completa**:
  - Removido formato de "card mobile" centralizado; implementado layout desktop completo, imersivo e profissional no Design System MetricLab 2.0.
  - Header superior institucional com logo `m.`, divisor vertical, nome do produto e badge "Acesso Exclusivo Mobile".
  - Grid de 2 colunas:
    - **Coluna Esquerda**: Eyebrow "Dispositivo Não Suportado", título "Este sistema é exclusivo para acesso mobile. Acesse pelo seu celular.", contexto sobre laudos de campo e 3 cards de recursos (Laudo Fotográfico, Normas ABNT, Modo Offline), além de botão para copiar o link.
    - **Coluna Direita**: Card de destaque com QR Code real em alta definição.
- **QR Code Real & Funcional**:
  - Integração da biblioteca `qrcode` para renderização de QR Code escaneável codificando `https://vistoria.metriclab.com.br`.
  - Fallback vetorial SVG instantâneo.
- **Limpeza de Texto**:
  - Removida completamente a frase "Se você instalou o app como PWA no seu computador, abra-o pela janela do aplicativo instalado para liberar o acesso.".
- **Expansão em Tela Cheia no Root Layout (`app/layout.tsx`)**:
  - Removido `max-w-md mx-auto`, `items-center` e bordas laterais simulando celular no desktop.
  - O root layout agora possui `w-full min-h-screen flex flex-col`, expandindo para 100% da largura da tela no computador com os avisos e QR Code destacados.

