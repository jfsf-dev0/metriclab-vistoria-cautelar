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

