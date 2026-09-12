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

---

### Padronização de Favicons na Identidade Visual MetricLab (Fundo Claro `m.`)
- **Estética MetricLab 2.0**:
  - Ícone com fundo claro (`#FFFFFF`), cantos arredondados (squircle `rx="14"`), borda hairline sutil (`#E5E5E3`), letra `m` geométrica em negrito `#111111` e ponto `.` em laranja MetricLab `#F5A623`.
  - Visibilidade perfeita tanto em abas de navegadores no modo escuro quanto no modo claro.
- **Arquivos Gerados & Substituídos**:
  - `public/favicon.svg` (SVG vetorial escalável para navegadores modernos).
  - `public/favicon.ico` e `app/favicon.ico` (multi-resolução 16x16 e 32x32 para navegadores legados e Next.js App Router).
  - `public/favicon.png` (32x32).
  - `public/apple-touch-icon.png` (180x180 para iOS).
  - `public/icon-192.png` e `public/icon-512.png` (resoluções PWA de alta definição substituindo os ícones azuis antigos).
- **Metadata (`app/layout.tsx`)**:
  - `metadata.icons` configurado com referências completas a `favicon.ico`, `favicon.svg`, `icon-192.png` e `apple-touch-icon.png`.

---

### Open Graph Meta Tags e Imagem Social para WhatsApp (og-image.jpg)
- **Data**: 11 de Setembro de 2026
- **Objetivo**: Configuração de meta tags Open Graph e Twitter Cards, e geração da imagem social (`og-image.jpg`) de 1200x630px para compartilhamento rico no WhatsApp e redes sociais.
- **Implementação Técnica**:
  - `app/layout.tsx`:
    - Adicionado objeto `openGraph` e `twitter` na exportação `metadata: Metadata` com `metadataBase: new URL('https://vistoria.metriclab.com.br')`.
    - Adicionadas tags `<meta property="og:..." />` e `<meta name="twitter:..." />` estáticas no `<head>` para compatibilidade 100% com o scraper do WhatsApp e crawlers sem execução JavaScript.
    - Tags configuradas:
      - `og:title`: "Vistoria de Campo · MetricLab"
      - `og:description`: "Checklist parametrizável, registro fotográfico com geotag e assinatura digital. Funciona offline. Acesse pelo celular."
      - `og:image`: "https://vistoria.metriclab.com.br/og-image.jpg"
      - `og:url`: "https://vistoria.metriclab.com.br"
      - `og:type`: "website"
      - `og:site_name`: "MetricLab"
      - `twitter:card`: "summary_large_image"
      - `twitter:title`: "Vistoria de Campo · MetricLab"
      - `twitter:description`: "Checklist parametrizável, registro fotográfico com geotag e assinatura digital. Funciona offline."
      - `twitter:image`: "https://vistoria.metriclab.com.br/og-image.jpg"
  - `public/og-image.jpg`:
    - Dimensões: 1200 x 630px em formato JPEG.
    - Fundo branco (`#FFFFFF`), barra superior de 8px em laranja MetricLab (`#F5A623`).
    - Top-left: Logo `m.` (`m` em `#111111`, `.` em `#F5A623`) + "MetricLab" em negrito.
    - Centro: Título "Vistoria de Campo" (Inter Bold 72px `#111111`) e subtítulo "Checklist · Foto com geotag · Assinatura digital · Offline" (Inter Regular 28px `#6B7280`).
    - Rodapé direito: URL "vistoria.metriclab.com.br" (Inter 20px `#F5A623`).
  - **Correção de Redirecionamento e Crawlers (WhatsApp / Facebook External Hit)**:
    - Identificado que o scraper da Meta/WhatsApp (`facebookexternalhit/1.1` e `WhatsApp/*`) era detectado como dispositivo desktop pelo middleware e recebia redirecionamento HTTP 307 para `/desktop-blocked`, impossibilitando a leitura das meta tags Open Graph e da imagem.
    - Adicionado bypass explícito no `middleware.ts` para robôs de preview social (`WhatsApp`, `facebookexternalhit`, `Facebot`, `Twitterbot`, `LinkedInBot`, `TelegramBot`, `Slackbot`, `meta-externalagent`, `Googlebot`, etc.).
    - Configurado `app/page.tsx` para renderizar diretamente a tela de acesso sem redirecionamento 307 no root `/`, retornando HTTP 200 diretamente para os scrapers.
    - Adicionadas tags `og:image:secure_url`, `og:image:type`, `og:image:width`, `og:image:height` e `og:image:alt` para enriquecimento do card.
- **Validação**:
  - Compilação e build Next.js 14 executados com sucesso (código 0).

---

### Forçar Login ao Abrir o PWA & Eliminação de Acesso via LocalStorage
- **Data**: 11 de Setembro de 2026
- **Objetivo**: Garantir que o PWA sempre exija login ao ser aberto ou iniciado, eliminando qualquer auto-login persistente via `localStorage` ou cookies de longa duração, permitindo acesso às áreas restritas unicamente a usuários autenticados na sessão ativa.
- **Implementação Técnica**:
  - `lib/auth.ts`:
    - Substituído armazenamento persistente em `localStorage` por `sessionStorage` e **Session Cookie** HTTP (sem atributos `max-age` ou `expires`, com descarte automático ao fechar a janela/PWA).
    - Adicionada rotina em `getSession()`, `setSession()` e `clearSession()` para remover ativamente chaves residuais de `localStorage` (`ml_vistoria_session`).
  - `middleware.ts`:
    - Removido o bloco de redirecionamento automático que desviava requisições de `/` e `/login` diretamente para `/home` quando havia cookie de sessão existente.
    - Adicionado purge do cookie de sessão ao carregar a página `/` ou `/login`, garantindo que todo novo acesso ao PWA exija autenticação.
    - Mantida proteção de rotas restritas (`/trechos`, `/vistoria/*`, `/home`, `/rdo`, `/ocorrencia`) exigindo cookie de sessão ativo.
  - `app/login/page.tsx`:
    - Adicionado hook de montagem (`useEffect`) que aciona `clearSession()` imediatamente, garantindo que qualquer estado residual de sessão seja destruído antes de nova autenticação.
  - `app/home/page.tsx`, `components/pwa/PwaManager.tsx`:
    - Removidos acessos diretos a `localStorage.getItem('ml_vistoria_session')`, padronizando o consumo através de `getSession()` do módulo `@/lib/auth`.
    - Adicionado botão "Sair" no header principal (`/home`) para encerramento explícito de sessão com limpeza de tokens e redirecionamento para `/login`.
- **Validação**:
  - Build de produção (`next build`) executado e validado com sucesso (código de saída 0).

---

### Auditoria Visual Pré-Demo — Captura Automatizada de Screenshots (Playwright)
- **Data**: 11 de Setembro de 2026
- **Objetivo**: Capturar screenshots em alta fidelidade de todas as telas acessíveis do PWA Vistoria Cautelar (`vistoria.metriclab.com.br`) em viewports Mobile (`390x844` — iPhone 14) e Desktop (`1440x900` com bypass `ml_pwa_standalone=true`) para auditoria visual antes da demonstração executiva.
- **Implementação Técnica**:
  - Script Playwright automatizado em `/Users/joaofreire/metriclab/scripts/screenshot-audit.mjs`.
  - Tratamento de autenticação via sessão ativa (`ml_vistoria_session` e `sessionStorage`), simulador de etapas de login (Etapa 1 identificador e Etapa 3 código de bypass demo `123456`).
  - Supressão de banners intrusivos de instalação PWA via flag de persistência `ml_pwa_install_banner_dismissed` para registro limpo dos layouts.
  - Screenshots capturados:
    1. `01-splash.png`: Splash screen com display "Pacote 15 e 19" e botão Entrar.
    2. `02-login.png`: Tela de login na Etapa 1 com input de telefone/email.
    3. `03-login-codigo.png`: Tela de login na Etapa 3 com campo de 6 dígitos preenchido (`123456`).
    4. `04-home.png`: Dashboard principal autenticado com cards estatísticos e feed de campo.
    5. `05-vistoria-novo-passo1.png`: Formulário de Nova Vistoria — Passo 1 (Identificação do Imóvel).
    6. `06-vistoria-novo-passo2.png`: Formulário de Nova Vistoria — Passo 2 (Checklist de 6 itens).
    7. `07-vistoria-status.png`: Laudo de Vistoria Concluída com avaliação da IA (Aprovada 94 de 100).
    8. `08-ocorrencia.png`: Formulário de Registro de Ocorrência de Campo.
    9. `09-desktop-blocked.png`: Tela de bloqueio desktop com QR Code.
  - Gerado painel HTML comparativo lado a lado em `screenshots/index.html`.

---

### Redesign Mobile UI — Design System MetricLab 2.0
- **Data**: 11 de Setembro de 2026
- **Objetivo**: Reestruturação integral da interface mobile do PWA Vistoria Cautelar conforme as especificações rígidas do MetricLab 2.0.
- **Implementações**:
  - `tailwind.config.ts` e `app/globals.css`: Tokens unificados de design system (`#F7F7F5`, `#FFFFFF`, `#E2E2DC`, `#111111`, `#6B7280`, `#9CA3AF`, `#DC2626`).
  - Zero border radius em botões, inputs, cards e badges (`rounded-none`).
  - Inputs com altura de 48px, borda 1px `#E2E2DC`, labels em 12px uppercase tracking `0.08em` `#6B7280`.
  - Botões com 52px de altura, full-width, texto 15px Inter 600.
  - HeaderMobile de 56px, fundo branco, borda inferior 1px `#E2E2DC`, título 18px Inter 600.
  - Multi-step form com barra de progresso linear de 2px no topo e botão fixo de 52px no rodapé.
  - Tela de splash dedicada em canvas branco com logotipo `m.` em 48px.

---

### Reforço Estrito de Bloqueio Desktop & Remoção de Bypass de Produção
- **Data**: 11 de Setembro de 2026
- **Objetivo**: Bloquear completamente o acesso desktop em todas as rotas (mesmo para usuários autenticados ou com sessão ativa) e eliminar qualquer contorno via localStorage ou standalone em produção.
- **Implementações**:
  - **Middleware (`middleware.ts`)**:
    - Detecção antecipada por `User-Agent` e `Sec-CH-UA-Mobile`.
    - Redirecionamento incondicional para `/desktop-blocked` para qualquer dispositivo desktop, independente de autenticação, sessão ou rota acessada.
    - Exceção autorizada restrita ao header `x-playwright-audit === process.env.PLAYWRIGHT_SECRET`.
    - Eliminação de bypass via `ml_pwa_standalone` em ambiente de produção.
  - **Guard do Cliente (`hooks/useDesktopBlock.ts`)**:
    - Hook client-side executado no `mount` e no evento `resize` da janela.
    - Se `window.innerWidth > 768`, executa `router.replace('/desktop-blocked')` imediato, sem aviso ou delay.
    - Aplicado no `HeaderMobile` e em todas as páginas autenticadas (`/home`, `/vistoria/novo`, `/vistoria/[id]/status`, etc.).
  - **Tela `/desktop-blocked` Redesenhada**:
    - Fundo `#F7F7F5`, centralização vertical e horizontal absoluta.
    - Logotipo `m.` 32px no topo com ponto `#F5A623`.
    - Título "Este aplicativo é exclusivo para dispositivos móveis" (Inter 600, 18px, `#111111`).
    - Subtítulo "Acesse pelo seu celular para continuar." (Inter 400, 14px, `#9CA3AF`).
    - QR Code centralizado em 160x160px para `https://vistoria.metriclab.com.br`.
    - Endereço web `vistoria.metriclab.com.br` (Inter 400, 13px, `#9CA3AF`).
    - Remoção de botões de cópia, links ou instruções supérfluas.
  - **Variável de Ambiente**:
    - Configurado `PLAYWRIGHT_SECRET=metriclab_audit_2026` em `.env.production` e `.env.local`.

---

### Captura em Tempo Real de Geolocalização & Remoção de Hardcode (Vistoria Cautelar)
- **Data**: 12 de Setembro de 2026
- **Objetivo**: Substituir coordenadas fixas/hardcoded (`-23.5489, -46.6388`) por captura real em tempo real via `navigator.geolocation` com hook dedicado, feedback visual dinâmico e permissão no manifesto PWA.
- **Implementações**:
  - **Hook `useGeolocation` (`hooks/useGeolocation.ts`)**:
    - Criado hook de geolocalização com estados `latitude`, `longitude`, `accuracy`, `error` e `loading`.
    - Configurado com `enableHighAccuracy: true`, `timeout: 10000`, `maximumAge: 0`.
  - **Formulário de Vistoria (`app/vistoria/novo/page.tsx`)**:
    - Removidas coordenadas hardcoded de São Paulo.
    - Integrado `useGeolocation` no formulário de registro.
    - Payload de submissão enriquecido com `latitude`, `longitude`, `accuracy`, `geolocated_at` e compatibilidade com `geolat`/`geolng`.
    - Feedback visual sob o campo GEOLOCALIZAÇÃO:
      - `loading`: "Obtendo localização..." em Inter 400, 12px, `#9CA3AF`.
      - `error`: "Localização indisponível — verifique as permissões do celular" em Inter 400, 12px, `#DC2626`.
      - `success`: "Localização capturada" em Inter 400, 12px, `#6B7280`. Coordenadas não são exibidas ao usuário, gravadas apenas no banco.
  - **Manifesto PWA (`public/manifest.json`)**:
    - Adicionado `"permissions": ["geolocation"]`.
